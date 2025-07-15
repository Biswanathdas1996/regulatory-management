import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { ModernValidationRulesParser } from './ModernValidationRulesParser';

interface ValidationRule {
  id?: number;
  templateId: number;
  sheetId?: number;
  field: string;
  ruleType: string;
  condition: string;
  errorMessage: string;
  severity: 'error' | 'warning';
  isActive: boolean;
  rowRange?: string; // e.g., "2-100", "5", "10-*"
  columnRange?: string; // e.g., "A-Z", "B", "C-E"
  cellRange?: string; // e.g., "A2:Z100", "B5", "C1:C50"
  applyToAllRows?: boolean;
}

interface ValidationResult {
  submissionId: number;
  ruleId?: number;
  field: string;
  ruleType: string;
  condition: string;
  cellReference?: string;
  cellValue?: string;
  errorMessage: string;
  severity: 'error' | 'warning';
  isValid: boolean;
  sheetName?: string;
  rowNumber?: number;
  columnName?: string;
}

interface ValidationSummary {
  results: ValidationResult[];
  summary: {
    totalRules: number;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    errorCount: number;
    warningCount: number;
    overallStatus: 'passed' | 'failed' | 'warnings';
  };
  metadata: {
    templateName?: string;
    fileName: string;
    validationDate: string;
    processingTime: number;
  };
}

export class ModernValidationEngine {
  /**
   * Validate a submission using modern validation rules
   */
  static async validateSubmission({
    filePath,
    templateId,
    submissionId,
    validationRulesPath,
    fileName
  }: {
    filePath: string;
    templateId: number;
    submissionId: number;
    validationRulesPath?: string;
    fileName: string;
  }): Promise<ValidationSummary> {
    const startTime = Date.now();
    
    try {
      // First, try to load validation rules from the validation file
      let validationRules: ValidationRule[] = [];
      
      if (validationRulesPath && fs.existsSync(validationRulesPath)) {
        console.log(`Loading validation rules from file: ${validationRulesPath}`);
        const parsedRules = await ModernValidationRulesParser.parseValidationFile(
          validationRulesPath,
          templateId
        );
        
        if (parsedRules.errors.length > 0) {
          console.warn('Validation file parsing errors:', parsedRules.errors);
        }
        
        validationRules = parsedRules.rules;
        console.log(`Loaded ${validationRules.length} validation rules from file`);
      } else {
        console.log('No validation file found, using database rules as fallback');
        // Fallback to database rules if no validation file
        const { storage } = await import('../server/storage');
        validationRules = await storage.getValidationRules(templateId);
      }
      
      if (validationRules.length === 0) {
        console.log('No validation rules found - submission passes by default');
        return {
          results: [],
          summary: {
            totalRules: 0,
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: 0,
            errorCount: 0,
            warningCount: 0,
            overallStatus: 'passed'
          },
          metadata: {
            fileName,
            validationDate: new Date().toISOString(),
            processingTime: Date.now() - startTime
          }
        };
      }

      // Load and parse the submission file
      const submissionData = await this.loadSubmissionData(filePath);
      
      // Validate the submission against all rules
      const results = await this.validateAgainstRules(
        submissionData,
        validationRules,
        submissionId
      );

      // Calculate summary statistics
      const summary = this.calculateSummary(results, validationRules);

      return {
        results,
        summary,
        metadata: {
          fileName,
          validationDate: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Validation engine error:', error);
      
      // Return error result
      return {
        results: [{
          submissionId,
          field: 'system',
          ruleType: 'system',
          condition: 'file_processing',
          errorMessage: `Failed to process submission: ${error.message}`,
          severity: 'error',
          isValid: false
        }],
        summary: {
          totalRules: 0,
          totalChecks: 1,
          passedChecks: 0,
          failedChecks: 1,
          errorCount: 1,
          warningCount: 0,
          overallStatus: 'failed'
        },
        metadata: {
          fileName,
          validationDate: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Load submission data from Excel/CSV file
   */
  private static async loadSubmissionData(filePath: string): Promise<any> {
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.csv') {
      return this.loadCsvData(filePath);
    } else if (extension === '.xlsx' || extension === '.xls') {
      return this.loadExcelData(filePath);
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  /**
   * Load Excel data
   */
  private static async loadExcelData(filePath: string): Promise<any> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const sheets: any[] = [];
    
    workbook.worksheets.forEach((worksheet, index) => {
      const sheetData: any[][] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell((cell, colNumber) => {
          rowData[colNumber - 1] = cell.value;
        });
        sheetData.push(rowData);
      });
      
      sheets.push({
        name: worksheet.name,
        index: index,
        data: sheetData,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount
      });
    });
    
    return { sheets, type: 'excel' };
  }

  /**
   * Load CSV data
   */
  private static async loadCsvData(filePath: string): Promise<any> {
    const csv = await import('csv-parser');
    const results: any[] = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve({
            sheets: [{
              name: 'Sheet1',
              index: 0,
              data: results,
              rowCount: results.length,
              columnCount: Object.keys(results[0] || {}).length
            }],
            type: 'csv'
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Validate submission data against validation rules
   */
  private static async validateAgainstRules(
    submissionData: any,
    validationRules: ValidationRule[],
    submissionId: number
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const rule of validationRules) {
      if (!rule.isActive) continue;
      
      // Find the sheet to validate
      const targetSheet = rule.sheetId 
        ? submissionData.sheets.find((s: any) => s.index === rule.sheetId - 1)
        : submissionData.sheets[0]; // Default to first sheet if no specific sheet
      
      if (!targetSheet) {
        results.push({
          submissionId,
          ruleId: rule.id,
          field: rule.field,
          ruleType: rule.ruleType,
          condition: rule.condition,
          errorMessage: `Sheet not found for validation rule: ${rule.field}`,
          severity: 'error',
          isValid: false,
          sheetName: 'Unknown'
        });
        continue;
      }

      // Validate rule against sheet data
      const ruleResults = await this.validateRule(
        rule,
        targetSheet,
        submissionId
      );
      
      results.push(...ruleResults);
    }
    
    return results;
  }

  /**
   * Validate a single rule against sheet data
   */
  private static async validateRule(
    rule: ValidationRule,
    sheet: any,
    submissionId: number
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      switch (rule.ruleType) {
        case 'required':
          return this.validateRequiredRule(rule, sheet, submissionId);
        case 'format':
          return this.validateFormatRule(rule, sheet, submissionId);
        case 'range':
          return this.validateRangeRule(rule, sheet, submissionId);
        case 'custom':
          return this.validateCustomRule(rule, sheet, submissionId);
        default:
          results.push({
            submissionId,
            ruleId: rule.id,
            field: rule.field,
            ruleType: rule.ruleType,
            condition: rule.condition,
            errorMessage: `Unknown rule type: ${rule.ruleType}`,
            severity: 'error',
            isValid: false,
            sheetName: sheet.name
          });
          return results;
      }
    } catch (error) {
      results.push({
        submissionId,
        ruleId: rule.id,
        field: rule.field,
        ruleType: rule.ruleType,
        condition: rule.condition,
        errorMessage: `Rule validation error: ${error.message}`,
        severity: 'error',
        isValid: false,
        sheetName: sheet.name
      });
      return results;
    }
  }

  /**
   * Validate required field rule
   */
  private static validateRequiredRule(
    rule: ValidationRule,
    sheet: any,
    submissionId: number
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Parse field reference (e.g., "A1:A100" or "Company Name") with enhanced row/column range support
    const fieldInfo = this.parseFieldReference(rule.field, sheet, rule);
    
    fieldInfo.cells.forEach((cell, index) => {
      const isEmpty = cell.value === null || 
                      cell.value === undefined || 
                      cell.value === '' ||
                      (typeof cell.value === 'string' && cell.value.trim() === '');
      
      if (isEmpty) {
        results.push({
          submissionId,
          ruleId: rule.id,
          field: rule.field,
          ruleType: rule.ruleType,
          condition: rule.condition,
          cellReference: cell.reference,
          cellValue: String(cell.value || ''),
          errorMessage: rule.errorMessage,
          severity: rule.severity,
          isValid: false,
          sheetName: sheet.name,
          rowNumber: cell.row,
          columnName: cell.column
        });
      } else {
        results.push({
          submissionId,
          ruleId: rule.id,
          field: rule.field,
          ruleType: rule.ruleType,
          condition: rule.condition,
          cellReference: cell.reference,
          cellValue: String(cell.value),
          errorMessage: rule.errorMessage,
          severity: rule.severity,
          isValid: true,
          sheetName: sheet.name,
          rowNumber: cell.row,
          columnName: cell.column
        });
      }
    });
    
    return results;
  }

  /**
   * Validate format rule (email, phone, date, etc.)
   */
  private static validateFormatRule(
    rule: ValidationRule,
    sheet: any,
    submissionId: number
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const fieldInfo = this.parseFieldReference(rule.field, sheet, rule);
    
    // Parse format condition (e.g., "email", "phone", "date:YYYY-MM-DD")
    const formatType = rule.condition.toLowerCase();
    
    fieldInfo.cells.forEach((cell) => {
      const value = String(cell.value || '').trim();
      
      // Skip empty values for format validation
      if (value === '') {
        results.push({
          submissionId,
          ruleId: rule.id,
          field: rule.field,
          ruleType: rule.ruleType,
          condition: rule.condition,
          cellReference: cell.reference,
          cellValue: value,
          errorMessage: rule.errorMessage,
          severity: rule.severity,
          isValid: true, // Empty values pass format validation
          sheetName: sheet.name,
          rowNumber: cell.row,
          columnName: cell.column
        });
        return;
      }
      
      let isValid = false;
      
      switch (formatType) {
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          break;
        case 'phone':
          isValid = /^[\+]?[\d\s\-\(\)]+$/.test(value);
          break;
        case 'number':
          isValid = !isNaN(Number(value));
          break;
        case 'date':
          isValid = !isNaN(Date.parse(value));
          break;
        default:
          if (formatType.startsWith('regex:')) {
            const pattern = formatType.substring(6);
            isValid = new RegExp(pattern).test(value);
          } else {
            isValid = true; // Unknown format passes
          }
      }
      
      results.push({
        submissionId,
        ruleId: rule.id,
        field: rule.field,
        ruleType: rule.ruleType,
        condition: rule.condition,
        cellReference: cell.reference,
        cellValue: value,
        errorMessage: rule.errorMessage,
        severity: rule.severity,
        isValid,
        sheetName: sheet.name,
        rowNumber: cell.row,
        columnName: cell.column
      });
    });
    
    return results;
  }

  /**
   * Validate range rule (min/max values)
   */
  private static validateRangeRule(
    rule: ValidationRule,
    sheet: any,
    submissionId: number
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const fieldInfo = this.parseFieldReference(rule.field, sheet, rule);
    
    // Parse range condition (e.g., "min:0,max:100")
    const ranges = rule.condition.split(',');
    let minValue = -Infinity;
    let maxValue = Infinity;
    
    ranges.forEach(range => {
      const [type, value] = range.split(':');
      if (type === 'min') minValue = parseFloat(value);
      if (type === 'max') maxValue = parseFloat(value);
    });
    
    fieldInfo.cells.forEach((cell) => {
      const value = parseFloat(String(cell.value || ''));
      
      if (isNaN(value)) {
        results.push({
          submissionId,
          ruleId: rule.id,
          field: rule.field,
          ruleType: rule.ruleType,
          condition: rule.condition,
          cellReference: cell.reference,
          cellValue: String(cell.value || ''),
          errorMessage: `${rule.errorMessage} (not a number)`,
          severity: rule.severity,
          isValid: false,
          sheetName: sheet.name,
          rowNumber: cell.row,
          columnName: cell.column
        });
        return;
      }
      
      const isValid = value >= minValue && value <= maxValue;
      
      results.push({
        submissionId,
        ruleId: rule.id,
        field: rule.field,
        ruleType: rule.ruleType,
        condition: rule.condition,
        cellReference: cell.reference,
        cellValue: String(cell.value),
        errorMessage: rule.errorMessage,
        severity: rule.severity,
        isValid,
        sheetName: sheet.name,
        rowNumber: cell.row,
        columnName: cell.column
      });
    });
    
    return results;
  }

  /**
   * Validate custom rule
   */
  private static validateCustomRule(
    rule: ValidationRule,
    sheet: any,
    submissionId: number
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const fieldInfo = this.parseFieldReference(rule.field, sheet, rule);
    
    // For now, treat custom rules as always passing
    // This can be extended to support custom validation logic
    fieldInfo.cells.forEach((cell) => {
      results.push({
        submissionId,
        ruleId: rule.id,
        field: rule.field,
        ruleType: rule.ruleType,
        condition: rule.condition,
        cellReference: cell.reference,
        cellValue: String(cell.value || ''),
        errorMessage: rule.errorMessage,
        severity: rule.severity,
        isValid: true, // Custom rules pass for now
        sheetName: sheet.name,
        rowNumber: cell.row,
        columnName: cell.column
      });
    });
    
    return results;
  }

  /**
   * Parse field reference to get cell locations with enhanced row/column range support
   */
  private static parseFieldReference(field: string, sheet: any, rule?: ValidationRule): {
    cells: Array<{
      reference: string;
      value: any;
      row: number;
      column: string;
    }>;
  } {
    const cells: Array<{
      reference: string;
      value: any;
      row: number;
      column: string;
    }> = [];
    
    // If rule has specific cell range, use that
    if (rule?.cellRange) {
      return this.parseCellRange(rule.cellRange, sheet);
    }
    
    // If rule has row and column ranges, combine them
    if (rule?.rowRange || rule?.columnRange) {
      return this.parseRowColumnRange(rule, sheet);
    }
    
    // Check if it's a cell range (e.g., "A1:A100")
    if (field.includes(':')) {
      const [startCell, endCell] = field.split(':');
      const startCol = startCell.match(/[A-Z]+/)?.[0] || 'A';
      const startRow = parseInt(startCell.match(/\d+/)?.[0] || '1');
      const endCol = endCell.match(/[A-Z]+/)?.[0] || startCol;
      const endRow = parseInt(endCell.match(/\d+/)?.[0] || String(sheet.rowCount));
      
      // Convert column letters to numbers
      const startColNum = this.columnToNumber(startCol);
      const endColNum = this.columnToNumber(endCol);
      
      for (let row = startRow; row <= Math.min(endRow, sheet.rowCount); row++) {
        for (let col = startColNum; col <= endColNum; col++) {
          const colLetter = this.numberToColumn(col);
          const cellRef = `${colLetter}${row}`;
          const value = sheet.data[row - 1]?.[col - 1];
          
          cells.push({
            reference: cellRef,
            value,
            row,
            column: colLetter
          });
        }
      }
    } else if (field.match(/^[A-Z]+\d+$/)) {
      // Single cell reference (e.g., "A1")
      const col = field.match(/[A-Z]+/)?.[0] || 'A';
      const row = parseInt(field.match(/\d+/)?.[0] || '1');
      const colNum = this.columnToNumber(col);
      const value = sheet.data[row - 1]?.[colNum - 1];
      
      cells.push({
        reference: field,
        value,
        row,
        column: col
      });
    } else {
      // Assume it's a column name in the header row
      const headerRow = sheet.data[0] || [];
      const colIndex = headerRow.findIndex((header: any) => 
        String(header || '').toLowerCase() === field.toLowerCase()
      );
      
      if (colIndex !== -1) {
        for (let row = 1; row < sheet.rowCount; row++) {
          const colLetter = this.numberToColumn(colIndex + 1);
          const cellRef = `${colLetter}${row + 1}`;
          const value = sheet.data[row]?.[colIndex];
          
          cells.push({
            reference: cellRef,
            value,
            row: row + 1,
            column: colLetter
          });
        }
      }
    }
    
    return { cells };
  }

  /**
   * Parse specific cell range (e.g., "A2:C10", "B5")
   */
  private static parseCellRange(cellRange: string, sheet: any): { cells: any[] } {
    const cells: any[] = [];
    
    if (cellRange.includes(':')) {
      // Range format (e.g., "A2:C10")
      const [startCell, endCell] = cellRange.split(':');
      const startMatch = startCell.match(/^([A-Z]+)(\d+)$/);
      const endMatch = endCell.match(/^([A-Z]+)(\d+)$/);
      
      if (startMatch && endMatch) {
        const startCol = this.columnToNumber(startMatch[1]);
        const startRow = parseInt(startMatch[2]) - 1;
        const endCol = this.columnToNumber(endMatch[1]);
        const endRow = parseInt(endMatch[2]) - 1;
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            if (sheet.data[row] && sheet.data[row][col - 1] !== undefined) {
              const colLetter = this.numberToColumn(col);
              cells.push({
                value: sheet.data[row][col - 1],
                row: row + 1,
                column: colLetter,
                reference: `${colLetter}${row + 1}`
              });
            }
          }
        }
      }
    } else {
      // Single cell (e.g., "B5")
      const match = cellRange.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const columnIndex = this.columnToNumber(match[1]) - 1;
        const rowIndex = parseInt(match[2]) - 1;
        
        if (sheet.data[rowIndex] && sheet.data[rowIndex][columnIndex] !== undefined) {
          cells.push({
            value: sheet.data[rowIndex][columnIndex],
            row: parseInt(match[2]),
            column: match[1],
            reference: cellRange
          });
        }
      }
    }
    
    return { cells };
  }

  /**
   * Parse row and column ranges to determine cells to validate
   */
  private static parseRowColumnRange(rule: ValidationRule, sheet: any): { cells: any[] } {
    const cells: any[] = [];
    
    // Parse row range (e.g., "2-100", "5", "10-*")
    let startRow = 1, endRow = sheet.data.length - 1;
    if (rule.rowRange) {
      if (rule.rowRange.includes('-')) {
        const [start, end] = rule.rowRange.split('-');
        startRow = parseInt(start) - 1;
        endRow = end === '*' ? sheet.data.length - 1 : parseInt(end) - 1;
      } else {
        startRow = endRow = parseInt(rule.rowRange) - 1;
      }
    }
    
    // Parse column range (e.g., "A-Z", "B", "C-E")
    let startCol = 1, endCol = sheet.data[0]?.length || 1;
    if (rule.columnRange) {
      if (rule.columnRange.includes('-')) {
        const [start, end] = rule.columnRange.split('-');
        startCol = this.columnToNumber(start);
        endCol = this.columnToNumber(end);
      } else {
        startCol = endCol = this.columnToNumber(rule.columnRange);
      }
    }
    
    // Generate cells within the specified ranges
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (sheet.data[row] && sheet.data[row][col - 1] !== undefined) {
          const colLetter = this.numberToColumn(col);
          cells.push({
            value: sheet.data[row][col - 1],
            row: row + 1,
            column: colLetter,
            reference: `${colLetter}${row + 1}`
          });
        }
      }
    }
    
    return { cells };
  }

  /**
   * Convert column letter to number (A=1, B=2, etc.)
   */
  private static columnToNumber(col: string): number {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 64);
    }
    return result;
  }

  /**
   * Convert number to column letter (1=A, 2=B, etc.)
   */
  private static numberToColumn(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  /**
   * Calculate validation summary
   */
  private static calculateSummary(
    results: ValidationResult[],
    validationRules: ValidationRule[]
  ): ValidationSummary['summary'] {
    const totalChecks = results.length;
    const passedChecks = results.filter(r => r.isValid).length;
    const failedChecks = totalChecks - passedChecks;
    const errorCount = results.filter(r => !r.isValid && r.severity === 'error').length;
    const warningCount = results.filter(r => !r.isValid && r.severity === 'warning').length;
    
    let overallStatus: 'passed' | 'failed' | 'warnings' = 'passed';
    if (errorCount > 0) {
      overallStatus = 'failed';
    } else if (warningCount > 0) {
      overallStatus = 'warnings';
    }
    
    return {
      totalRules: validationRules.filter(r => r.isActive).length,
      totalChecks,
      passedChecks,
      failedChecks,
      errorCount,
      warningCount,
      overallStatus
    };
  }
}