import ExcelJS from 'exceljs';
import * as csv from 'csv-parser';
import fs from 'fs';
import { ValidationRule, InsertValidationResult } from '@shared/schema';
import { storage } from '../storage';
import path from 'path';

export interface ValidationContext {
  submissionId: number;
  filePath: string;
  rules: ValidationRule[];
  onProgress?: (progress: number, message?: string) => void;
}

export interface ValidationSummary {
  totalRules: number;
  passed: number;
  failed: number;
  errors: number;
  warnings: number;
}

export class ValidationEngine {
  private static readonly BATCH_SIZE = 1000; // Process 1000 rows at a time
  private static readonly RESULT_BATCH_SIZE = 100; // Store results in batches
  
  /**
   * Validate a submitted file against template validation rules
   */
  static async validateSubmission(context: ValidationContext): Promise<{
    results: InsertValidationResult[];
    summary: ValidationSummary;
  }> {
    const fileExtension = path.extname(context.filePath).toLowerCase();
    
    // Report initial progress
    context.onProgress?.(0, 'Starting validation...');
    
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      return await this.validateExcelFile(context);
    } else if (fileExtension === '.csv') {
      return await this.validateCsvFile(context);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  private static async validateExcelFile(context: ValidationContext): Promise<{
    results: InsertValidationResult[];
    summary: ValidationSummary;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(context.filePath);
    
    const results: InsertValidationResult[] = [];
    
    if (workbook.worksheets.length === 0) {
      throw new Error('No worksheet found in the Excel file');
    }

    context.onProgress?.(10, 'Reading Excel data...');

    // Get submission's template sheets info if available
    const { db } = await import('../db');
    const { templateSheets } = await import('../../shared/schema');
    const submission = await db.query.submissions.findFirst({
      where: (s, { eq }) => eq(s.id, context.submissionId),
    });
    
    let sheetMapping: Map<number, number> = new Map(); // Map worksheet index to sheet ID
    if (submission) {
      const sheets = await db.query.templateSheets.findMany({
        where: (ts, { eq }) => eq(ts.templateId, submission.templateId),
      });
      sheets.forEach(sheet => {
        sheetMapping.set(sheet.sheetIndex, sheet.id);
      });
    }

    // Process each worksheet
    const totalSheets = workbook.worksheets.length;
    let processedSheets = 0;

    for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
      const worksheet = workbook.worksheets[sheetIndex];
      const sheetId = sheetMapping.get(sheetIndex);
      
      // Filter rules for this specific sheet (or rules without sheetId for backward compatibility)
      const sheetRules = context.rules.filter(rule => 
        rule.sheetId === sheetId || rule.sheetId === null || rule.sheetId === undefined
      );

      if (sheetRules.length === 0) {
        continue; // Skip if no rules for this sheet
      }

      const sheetProgress = 10 + Math.round((processedSheets / totalSheets) * 80);
      context.onProgress?.(sheetProgress, `Validating sheet: ${worksheet.name}`);

      const totalRows = worksheet.rowCount;
      let processedRules = 0;
      
      // Process rules for this sheet
      for (const rule of sheetRules) {
        const ruleProgress = sheetProgress + Math.round((processedRules / sheetRules.length) * (80 / totalSheets));
        context.onProgress?.(ruleProgress, `Sheet ${worksheet.name}: Validating ${rule.field}`);
        
        // For large datasets, process in chunks
        if (totalRows > this.BATCH_SIZE * 2) {
          const ruleResults = await this.validateRuleInChunks(rule, worksheet, context.submissionId);
          results.push(...ruleResults);
        } else {
          // For smaller datasets, use existing method
          const data = this.worksheetToData(worksheet);
          const ruleResults = await this.validateRule(rule, data, context.submissionId);
          results.push(...ruleResults);
        }
        
        processedRules++;
      }
      
      processedSheets++;
    }

    context.onProgress?.(90, 'Calculating summary...');
    const summary = this.calculateSummary(results);
    context.onProgress?.(100, 'Validation complete');
    
    return { results, summary };
  }

  private static async validateCsvFile(context: ValidationContext): Promise<{
    results: InsertValidationResult[];
    summary: ValidationSummary;
  }> {
    const data: any[][] = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(context.filePath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(Object.values(row));
        })
        .on('end', async () => {
          const results: InsertValidationResult[] = [];
          
          // Validate each rule
          for (const rule of context.rules) {
            const ruleResults = await this.validateRule(rule, data, context.submissionId);
            results.push(...ruleResults);
          }

          const summary = this.calculateSummary(results);
          resolve({ results, summary });
        })
        .on('error', reject);
    });
  }

  /**
   * Validate a rule in chunks for large datasets
   */
  private static async validateRuleInChunks(
    rule: ValidationRule, 
    worksheet: ExcelJS.Worksheet, 
    submissionId: number
  ): Promise<InsertValidationResult[]> {
    const results: InsertValidationResult[] = [];
    const cellReferences = this.parseCellReferences(rule.field);
    
    // Process each cell reference in chunks
    for (const ref of cellReferences) {
      if (ref.row !== null && ref.col !== null) {
        // Single cell reference
        const row = worksheet.getRow(ref.row + 1);
        const value = row.getCell(ref.col + 1).value;
        const validationResult = this.applyRuleLogic(rule, value, []);
        
        results.push({
          submissionId,
          ruleId: rule.id,
          field: ref.original,
          value: value?.toString() || '',
          passed: validationResult.passed,
          errorMessage: validationResult.passed ? '' : rule.errorMessage,
          severity: rule.severity
        });
      } else if (ref.original.includes(':')) {
        // Range reference - process in chunks
        const [startCell, endCell] = ref.original.split(':');
        const start = this.parseCell(startCell);
        const end = this.parseCell(endCell);
        
        if (start && end) {
          const totalRows = end.row - start.row + 1;
          const chunks = Math.ceil(totalRows / this.BATCH_SIZE);
          
          for (let chunk = 0; chunk < chunks; chunk++) {
            const chunkStart = start.row + (chunk * this.BATCH_SIZE);
            const chunkEnd = Math.min(start.row + ((chunk + 1) * this.BATCH_SIZE) - 1, end.row);
            
            // Process this chunk
            for (let row = chunkStart; row <= chunkEnd; row++) {
              for (let col = start.col; col <= end.col; col++) {
                const worksheetRow = worksheet.getRow(row + 1);
                const value = worksheetRow.getCell(col + 1).value;
                const validationResult = this.applyRuleLogic(rule, value, []);
                
                const cellRef = this.cellToString(row, col);
                results.push({
                  submissionId,
                  ruleId: rule.id,
                  field: cellRef,
                  value: value?.toString() || '',
                  passed: validationResult.passed,
                  errorMessage: validationResult.passed ? '' : rule.errorMessage,
                  severity: rule.severity
                });
              }
            }
          }
        }
      }
    }
    
    return results;
  }

  private static worksheetToData(worksheet: ExcelJS.Worksheet): any[][] {
    const data: any[][] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      const rowData: any[] = [];
      row.eachCell((cell, colNumber) => {
        rowData[colNumber - 1] = cell.value;
      });
      data[rowNumber - 1] = rowData;
    });
    
    return data;
  }

  private static async validateRule(
    rule: ValidationRule, 
    data: any[][], 
    submissionId: number
  ): Promise<InsertValidationResult[]> {
    const results: InsertValidationResult[] = [];
    
    // Parse field specification (e.g., "A1", "A1:B10", "company_name")
    const cellReferences = this.parseCellReferences(rule.field);
    
    for (const ref of cellReferences) {
      const value = this.getCellValue(data, ref);
      const validationResult = this.applyRuleLogic(rule, value, data);
      
      results.push({
        submissionId,
        ruleId: rule.id,
        field: ref.original,
        value: value?.toString() || '',
        passed: validationResult.passed,
        errorMessage: validationResult.passed ? '' : rule.errorMessage,
        severity: rule.severity
      });
    }
    
    return results;
  }

  private static parseCellReferences(field: string): Array<{
    original: string;
    row: number;
    col: number;
  }> {
    const references: Array<{ original: string; row: number; col: number }> = [];
    
    // Check if it's a cell range (e.g., "A1:B10")
    if (field.includes(':')) {
      const [start, end] = field.split(':');
      const startRef = this.parseCell(start);
      const endRef = this.parseCell(end);
      
      if (startRef && endRef) {
        for (let row = startRef.row; row <= endRef.row; row++) {
          for (let col = startRef.col; col <= endRef.col; col++) {
            references.push({
              original: this.cellToString(row, col),
              row,
              col
            });
          }
        }
      }
    } else {
      // Single cell reference
      const cellRef = this.parseCell(field);
      if (cellRef) {
        references.push({
          original: field,
          row: cellRef.row,
          col: cellRef.col
        });
      } else {
        // Treat as field name - use first row as header
        references.push({
          original: field,
          row: -1, // Special indicator for field name
          col: -1
        });
      }
    }
    
    return references;
  }

  private static parseCell(cellRef: string): { row: number; col: number } | null {
    const match = cellRef.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const col = this.columnToNumber(match[1]);
    const row = parseInt(match[2], 10);
    
    return { row: row - 1, col: col - 1 }; // Convert to 0-based
  }

  private static columnToNumber(column: string): number {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
  }

  private static cellToString(row: number, col: number): string {
    let column = '';
    let c = col + 1;
    while (c > 0) {
      c--;
      column = String.fromCharCode((c % 26) + 'A'.charCodeAt(0)) + column;
      c = Math.floor(c / 26);
    }
    return column + (row + 1);
  }

  private static getCellValue(data: any[][], ref: { row: number; col: number; original: string }): any {
    if (ref.row === -1) {
      // Field name - search in first row for column index
      const headers = data[0] || [];
      const colIndex = headers.findIndex((h: any) => 
        h?.toString().toLowerCase() === ref.original.toLowerCase()
      );
      
      if (colIndex !== -1) {
        // Return all values in that column (excluding header)
        return data.slice(1).map(row => row[colIndex]);
      }
      return null;
    }
    
    if (data[ref.row] && data[ref.row][ref.col] !== undefined) {
      return data[ref.row][ref.col];
    }
    return null;
  }

  private static applyRuleLogic(
    rule: ValidationRule, 
    value: any,
    data: any[][]
  ): { passed: boolean } {
    switch (rule.ruleType) {
      case 'required':
        return this.validateRequired(value, rule.condition);
      
      case 'format':
        return this.validateFormat(value, rule.condition);
      
      case 'range':
        return this.validateRange(value, rule.condition);
      
      case 'custom':
        return this.validateCustom(value, rule.condition, data);
      
      default:
        return { passed: false };
    }
  }

  private static validateRequired(value: any, condition: string): { passed: boolean } {
    if (condition === 'not_empty') {
      const passed = value !== null && 
                    value !== undefined && 
                    value !== '' &&
                    (Array.isArray(value) ? value.every(v => v !== null && v !== undefined && v !== '') : true);
      return { passed };
    }
    return { passed: false };
  }

  private static validateFormat(value: any, condition: string): { passed: boolean } {
    if (value === null || value === undefined) return { passed: false };
    
    // Handle array of values (for column validation)
    if (Array.isArray(value)) {
      return { passed: value.every(v => this.validateFormat(v, condition).passed) };
    }
    
    try {
      const regex = new RegExp(condition);
      return { passed: regex.test(value.toString()) };
    } catch {
      return { passed: false };
    }
  }

  private static validateRange(value: any, condition: string): { passed: boolean } {
    if (value === null || value === undefined) return { passed: false };
    
    // Handle array of values
    if (Array.isArray(value)) {
      return { passed: value.every(v => this.validateRange(v, condition).passed) };
    }
    
    // Parse condition (e.g., "min:0,max:100")
    const params: { [key: string]: number } = {};
    condition.split(',').forEach(param => {
      const [key, val] = param.split(':');
      params[key] = parseFloat(val);
    });
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return { passed: false };
    
    let passed = true;
    if (params.min !== undefined) passed = passed && numValue >= params.min;
    if (params.max !== undefined) passed = passed && numValue <= params.max;
    
    return { passed };
  }

  private static validateCustom(value: any, condition: string, data: any[][]): { passed: boolean } {
    // For custom validation, we'll evaluate simple conditions
    // In a production system, you might want to use a safe expression evaluator
    try {
      // Simple evaluation for demonstration
      // WARNING: In production, use a proper expression parser for security
      if (condition.includes('AND') || condition.includes('OR')) {
        // Handle compound conditions
        let evalCondition = condition
          .replace(/value/g, JSON.stringify(value))
          .replace(/AND/g, '&&')
          .replace(/OR/g, '||');
        
        // Basic safety check - only allow certain characters
        if (!/^[0-9\s\(\)\&\|\<\>\=\!\.\"\'\[\]]+$/.test(evalCondition)) {
          return { passed: false };
        }
        
        // This is a simplified example - in production, use a proper parser
        const result = new Function('return ' + evalCondition)();
        return { passed: !!result };
      }
      
      return { passed: false };
    } catch {
      return { passed: false };
    }
  }

  private static calculateSummary(results: InsertValidationResult[]): ValidationSummary {
    const summary: ValidationSummary = {
      totalRules: results.length,
      passed: 0,
      failed: 0,
      errors: 0,
      warnings: 0
    };
    
    for (const result of results) {
      if (result.passed) {
        summary.passed++;
      } else {
        summary.failed++;
        if (result.severity === 'error') {
          summary.errors++;
        } else {
          summary.warnings++;
        }
      }
    }
    
    return summary;
  }
}