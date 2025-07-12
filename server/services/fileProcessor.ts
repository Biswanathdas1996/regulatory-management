import * as fs from "fs";
import * as path from "path";
import ExcelJS from "exceljs";
import csvParser from "csv-parser";
import { storage } from "../storage";
import { extractSchemaWithAI, enhanceSchemaWithAI } from "./gemini";
import type { InsertTemplateSheet, InsertTemplateSchema } from "@shared/schema";

export interface ProcessedSheet {
  name: string;
  index: number;
  data: any[];
  dataPointCount: number;
}

export interface ProcessingResult {
  success: boolean;
  sheets?: ProcessedSheet[];
  error?: string;
}

export class FileProcessor {
  private static readonly CHUNK_SIZE = 1000; // Process 1000 rows at a time
  private static readonly MAX_ROWS_PER_CHUNK = 100; // For AI processing

  static async processFile(filePath: string, templateId: number): Promise<ProcessingResult> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      await storage.updateProcessingStatus(templateId, "extraction", "in_progress", "Starting file processing...", 10);

      let sheets: ProcessedSheet[];
      
      if (ext === '.xlsx' || ext === '.xls') {
        sheets = await this.processExcelFile(filePath, templateId);
      } else if (ext === '.csv') {
        sheets = await this.processCsvFile(filePath, templateId);
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }

      await storage.updateProcessingStatus(templateId, "extraction", "completed", "File processing completed", 50);

      return {
        success: true,
        sheets
      };
    } catch (error) {
      await storage.updateProcessingStatus(templateId, "extraction", "failed", `Processing failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  private static async processExcelFile(filePath: string, templateId: number): Promise<ProcessedSheet[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const sheets: ProcessedSheet[] = [];
    let sheetIndex = 0;

    for (const worksheet of workbook.worksheets) {
      const sheetData = await this.extractSheetData(worksheet, templateId, sheetIndex);
      sheets.push(sheetData);
      sheetIndex++;
    }

    return sheets;
  }

  private static async processCsvFile(filePath: string, templateId: number): Promise<ProcessedSheet[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          const sheet: ProcessedSheet = {
            name: 'CSV Data',
            index: 0,
            data: results,
            dataPointCount: results.length
          };
          resolve([sheet]);
        })
        .on('error', reject);
    });
  }

  private static async extractSheetData(worksheet: ExcelJS.Worksheet, templateId: number, sheetIndex: number): Promise<ProcessedSheet> {
    const data: any[] = [];
    const headers: string[] = [];
    
    // Get headers from first row
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || `Column_${colNumber}`;
    });

    // Process data in chunks
    let rowIndex = 2; // Start from row 2 (after headers)
    const maxRow = worksheet.rowCount;
    
    while (rowIndex <= maxRow) {
      const chunkEnd = Math.min(rowIndex + this.CHUNK_SIZE, maxRow);
      const chunk = this.extractRowChunk(worksheet, headers, rowIndex, chunkEnd);
      data.push(...chunk);
      rowIndex = chunkEnd + 1;
      
      // Update progress
      const progress = Math.round((rowIndex / maxRow) * 40) + 10; // 10-50% range
      await storage.updateProcessingStatus(templateId, "extraction", "in_progress", `Processing row ${rowIndex}/${maxRow}`, progress);
    }

    return {
      name: worksheet.name,
      index: sheetIndex,
      data,
      dataPointCount: data.length
    };
  }

  private static extractRowChunk(worksheet: ExcelJS.Worksheet, headers: string[], startRow: number, endRow: number): any[] {
    const chunk: any[] = [];
    
    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const rowData: any = {};
      
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      
      // Only add rows that have at least one non-empty cell
      if (Object.values(rowData).some(value => value !== null && value !== undefined && value !== '')) {
        chunk.push(rowData);
      }
    }
    
    return chunk;
  }

  static async generateSchemas(templateId: number): Promise<void> {
    try {
      await storage.updateProcessingStatus(templateId, "ai_processing", "in_progress", "Starting AI schema generation...", 60);

      const template = await storage.getTemplate(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      const sheets = await storage.getTemplateSheets(templateId);
      const schemas: any[] = [];

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        await storage.updateProcessingStatus(templateId, "ai_processing", "in_progress", `Processing sheet ${i + 1}/${sheets.length}: ${sheet.sheetName}`, Math.round(60 + (i * 20) / sheets.length));

        // Process data in chunks for AI
        const chunks = this.chunkDataForAI(sheet.extractedData);
        const consolidatedData = this.consolidateChunks(chunks);

        const schema = await extractSchemaWithAI(consolidatedData, sheet.sheetName, template.templateType);
        schemas.push(schema);

        // Store individual sheet schema
        await storage.createTemplateSchema({
          templateId,
          sheetId: sheet.id,
          schemaData: schema,
          aiConfidence: Math.round(schema.ai_confidence * 100),
          extractionNotes: schema.extraction_notes
        });
      }

      await storage.updateProcessingStatus(templateId, "ai_processing", "completed", "AI processing completed", 80);
      await storage.updateProcessingStatus(templateId, "schema_generation", "in_progress", "Generating consolidated schema...", 85);

      // Generate consolidated schema with cross-sheet relationships
      if (schemas.length > 1) {
        const enhanced = await enhanceSchemaWithAI(schemas, template.templateType);
        await storage.createTemplateSchema({
          templateId,
          sheetId: null,
          schemaData: enhanced,
          aiConfidence: 95,
          extractionNotes: "Consolidated schema with cross-sheet relationships"
        });
      }

      await storage.updateProcessingStatus(templateId, "schema_generation", "completed", "Schema generation completed", 100);
      await storage.updateTemplateStatus(templateId, "completed");

    } catch (error) {
      await storage.updateProcessingStatus(templateId, "ai_processing", "failed", `AI processing failed: ${error}`);
      await storage.updateTemplateStatus(templateId, "failed");
      throw error;
    }
  }

  private static chunkDataForAI(data: any): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < data.length; i += this.MAX_ROWS_PER_CHUNK) {
      chunks.push(data.slice(i, i + this.MAX_ROWS_PER_CHUNK));
    }
    return chunks;
  }

  private static consolidateChunks(chunks: any[][]): any {
    if (chunks.length === 0) return {};
    
    // Take first chunk as base and add summary statistics
    const baseChunk = chunks[0];
    const totalRows = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    
    return {
      sampleData: baseChunk,
      totalRows,
      chunkCount: chunks.length,
      dataTypes: this.analyzeDataTypes(baseChunk)
    };
  }

  private static analyzeDataTypes(data: any[]): Record<string, string> {
    const types: Record<string, string> = {};
    
    if (data.length === 0) return types;
    
    const firstRow = data[0];
    Object.keys(firstRow).forEach(key => {
      const values = data.map(row => row[key]).filter(v => v !== null && v !== undefined);
      if (values.length > 0) {
        types[key] = this.inferDataType(values);
      }
    });
    
    return types;
  }

  private static inferDataType(values: any[]): string {
    const sample = values.slice(0, 10); // Sample first 10 values
    
    if (sample.every(v => typeof v === 'number')) return 'number';
    if (sample.every(v => typeof v === 'boolean')) return 'boolean';
    if (sample.every(v => this.isDate(v))) return 'date';
    if (sample.every(v => this.isCurrency(v))) return 'currency';
    if (sample.every(v => this.isPercentage(v))) return 'percentage';
    
    return 'text';
  }

  private static isDate(value: any): boolean {
    return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
  }

  private static isCurrency(value: any): boolean {
    return typeof value === 'string' && /^\$?\d+(\.\d{2})?$/.test(value);
  }

  private static isPercentage(value: any): boolean {
    return typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value);
  }
}
