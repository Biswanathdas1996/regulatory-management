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
      await storage.updateProcessingStatus(templateId, "ai_processing", "in_progress", "Starting AI schema generation...", 5);

      const template = await storage.getTemplate(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      const sheets = await storage.getTemplateSheets(templateId);
      if (!sheets || sheets.length === 0) {
        throw new Error("No sheets found to process");
      }

      const schemas: any[] = [];
      const totalSheets = sheets.length;

      for (let i = 0; i < totalSheets; i++) {
        const sheet = sheets[i];
        const progress = Math.round(5 + (i / totalSheets) * 70); // 5-75% for individual sheets
        
        await storage.updateProcessingStatus(
          templateId, 
          "ai_processing", 
          "in_progress", 
          `Processing sheet ${i + 1}/${totalSheets}: ${sheet.sheetName}`, 
          progress
        );

        try {
          // Process data in chunks for AI
          const chunks = this.chunkDataForAI(sheet.extractedData || []);
          const consolidatedData = this.consolidateChunks(chunks);

          console.log(`Processing sheet ${sheet.sheetName} with ${sheet.dataPointCount} data points`);

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

          // Update progress after each successful sheet
          await storage.updateProcessingStatus(
            templateId, 
            "ai_processing", 
            "in_progress", 
            `Completed sheet ${i + 1}/${totalSheets}: ${sheet.sheetName}`, 
            Math.round(5 + ((i + 1) / totalSheets) * 70)
          );

        } catch (sheetError) {
          console.error(`Failed to process sheet ${sheet.sheetName}:`, sheetError);
          // Continue with other sheets even if one fails
          schemas.push({
            sheetName: sheet.sheetName,
            required_fields: [],
            ai_confidence: 0,
            extraction_notes: `Failed to process: ${sheetError instanceof Error ? sheetError.message : 'Unknown error'}`
          });
        }
      }

      await storage.updateProcessingStatus(templateId, "ai_processing", "completed", `Processed ${schemas.length} sheets successfully`, 80);
      await storage.updateProcessingStatus(templateId, "schema_generation", "in_progress", "Generating consolidated schema...", 85);

      // Generate consolidated schema with cross-sheet relationships
      if (schemas.length > 1 && schemas.some(s => s.ai_confidence > 0)) {
        try {
          const validSchemas = schemas.filter(s => s.ai_confidence > 0);
          if (validSchemas.length > 0) {
            const enhanced = await enhanceSchemaWithAI(validSchemas, template.templateType);
            await storage.createTemplateSchema({
              templateId,
              sheetId: null,
              schemaData: enhanced,
              aiConfidence: 95,
              extractionNotes: "Consolidated schema with cross-sheet relationships"
            });
          }
        } catch (enhanceError) {
          console.error("Failed to enhance schema:", enhanceError);
          // Not critical - we still have individual schemas
        }
      }

      await storage.updateProcessingStatus(templateId, "schema_generation", "completed", "All schemas generated successfully", 100);
      await storage.updateTemplateStatus(templateId, "completed");

    } catch (error) {
      console.error("Schema generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during AI processing";
      await storage.updateProcessingStatus(templateId, "ai_processing", "failed", `AI processing failed: ${errorMessage}`);
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
