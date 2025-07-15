import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';

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

interface ParsedValidationRules {
  rules: ValidationRule[];
  metadata: {
    templateName?: string;
    version?: string;
    createdBy?: string;
    createdDate?: string;
    description?: string;
  };
  errors: string[];
}

export class ModernValidationRulesParser {
  /**
   * Parse validation rules from various file formats
   */
  static async parseValidationFile(
    filePath: string,
    templateId: number
  ): Promise<ParsedValidationRules> {
    const extension = path.extname(filePath).toLowerCase();
    
    try {
      switch (extension) {
        case '.json':
          return await this.parseJsonSchema(filePath, templateId);
        case '.yaml':
        case '.yml':
          return await this.parseYamlConfig(filePath, templateId);
        case '.csv':
          return await this.parseCsvRules(filePath, templateId);
        case '.xlsx':
        case '.xls':
          return await this.parseExcelRules(filePath, templateId);
        case '.txt':
          return await this.parseLegacyTxtRules(filePath, templateId);
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      return {
        rules: [],
        metadata: {},
        errors: [`Failed to parse validation file: ${error.message}`]
      };
    }
  }

  /**
   * Parse JSON Schema format (industry standard)
   */
  private static async parseJsonSchema(
    filePath: string,
    templateId: number
  ): Promise<ParsedValidationRules> {
    const content = fs.readFileSync(filePath, 'utf8');
    const schema = JSON.parse(content);
    
    const rules: ValidationRule[] = [];
    const errors: string[] = [];
    
    // Validate JSON Schema structure
    if (!schema.sheetValidations) {
      errors.push('Missing sheetValidations in JSON Schema');
      return { rules, metadata: schema.metadata || {}, errors };
    }

    // Parse sheet validations
    for (const [sheetName, sheetValidation] of Object.entries(schema.sheetValidations)) {
      const sheetRules = sheetValidation as any;
      
      // Column validations
      if (sheetRules.columnValidations) {
        for (const [column, columnRules] of Object.entries(sheetRules.columnValidations)) {
          const colRules = columnRules as any;
          
          // Required field validation
          if (colRules.required) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'required',
              condition: 'NOT_EMPTY',
              errorMessage: `${column} is required in ${sheetName}`,
              severity: 'error',
              isActive: true
            });
          }
          
          // Data type validation
          if (colRules.dataType) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'dataType',
              condition: `TYPE_IS_${colRules.dataType.toUpperCase()}`,
              errorMessage: `${column} must be of type ${colRules.dataType}`,
              severity: 'error',
              isActive: true
            });
          }
          
          // Length validations
          if (colRules.minLength) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'minLength',
              condition: `LENGTH >= ${colRules.minLength}`,
              errorMessage: `${column} must be at least ${colRules.minLength} characters`,
              severity: 'error',
              isActive: true
            });
          }
          
          if (colRules.maxLength) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'maxLength',
              condition: `LENGTH <= ${colRules.maxLength}`,
              errorMessage: `${column} must not exceed ${colRules.maxLength} characters`,
              severity: 'error',
              isActive: true
            });
          }
          
          // Numeric range validations
          if (colRules.minimum !== undefined) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'minimum',
              condition: `VALUE >= ${colRules.minimum}`,
              errorMessage: `${column} must be at least ${colRules.minimum}`,
              severity: 'error',
              isActive: true
            });
          }
          
          if (colRules.maximum !== undefined) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'maximum',
              condition: `VALUE <= ${colRules.maximum}`,
              errorMessage: `${column} must not exceed ${colRules.maximum}`,
              severity: 'error',
              isActive: true
            });
          }
          
          // Pattern validation
          if (colRules.pattern) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'pattern',
              condition: `REGEX("${colRules.pattern}")`,
              errorMessage: `${column} format is invalid`,
              severity: 'error',
              isActive: true
            });
          }
          
          // Enum validation
          if (colRules.enumValues && Array.isArray(colRules.enumValues)) {
            rules.push({
              templateId,
              field: `${sheetName}.${column}`,
              ruleType: 'enum',
              condition: `VALUE IN [${colRules.enumValues.map(v => `"${v}"`).join(', ')}]`,
              errorMessage: `${column} must be one of: ${colRules.enumValues.join(', ')}`,
              severity: 'error',
              isActive: true
            });
          }
        }
      }
      
      // Cross-field validations
      if (sheetRules.crossFieldValidations && Array.isArray(sheetRules.crossFieldValidations)) {
        for (const crossField of sheetRules.crossFieldValidations) {
          rules.push({
            templateId,
            field: sheetName,
            ruleType: 'crossField',
            condition: crossField.expression,
            errorMessage: crossField.description || crossField.name,
            severity: crossField.severity || 'error',
            isActive: true
          });
        }
      }
    }
    
    // Global validations
    if (schema.globalValidations && Array.isArray(schema.globalValidations)) {
      for (const globalValidation of schema.globalValidations) {
        rules.push({
          templateId,
          field: 'GLOBAL',
          ruleType: 'global',
          condition: globalValidation.expression,
          errorMessage: globalValidation.description || globalValidation.name,
          severity: globalValidation.severity || 'error',
          isActive: true
        });
      }
    }
    
    return {
      rules,
      metadata: schema.metadata || {},
      errors
    };
  }

  /**
   * Parse YAML configuration format
   */
  private static async parseYamlConfig(
    filePath: string,
    templateId: number
  ): Promise<ParsedValidationRules> {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = yaml.load(content) as any;
    
    // Convert YAML to JSON Schema format and parse
    const jsonSchema = {
      metadata: config.metadata,
      sheetValidations: config.sheetValidations,
      globalValidations: config.globalValidations
    };
    
    return await this.parseJsonSchemaObject(jsonSchema, templateId);
  }

  /**
   * Parse CSV rules format
   */
  private static async parseCsvRules(
    filePath: string,
    templateId: number
  ): Promise<ParsedValidationRules> {
    const rules: ValidationRule[] = [];
    const errors: string[] = [];
    const metadata = {};
    
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            for (const row of results) {
              const ruleType = row.RuleType?.toLowerCase();
              
              if (ruleType === 'column') {
                // Column validation rule
                const field = `${row.SheetName}.${row.Column}`;
                
                if (row.Required === 'true') {
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'required',
                    condition: 'NOT_EMPTY',
                    errorMessage: `${row.Column} is required in ${row.SheetName}`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange, // e.g., "2-100", "5", "10-*"
                    columnRange: row.ColumnRange, // e.g., "A", "A-Z"
                    cellRange: row.CellRange, // e.g., "A2:A100", "B5"
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
                
                if (row.DataType) {
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'dataType',
                    condition: `TYPE_IS_${row.DataType.toUpperCase()}`,
                    errorMessage: `${row.Column} must be of type ${row.DataType}`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange,
                    columnRange: row.ColumnRange,
                    cellRange: row.CellRange,
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
                
                if (row.MinLength) {
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'minLength',
                    condition: `LENGTH >= ${row.MinLength}`,
                    errorMessage: `${row.Column} must be at least ${row.MinLength} characters`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange,
                    columnRange: row.ColumnRange,
                    cellRange: row.CellRange,
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
                
                if (row.MaxLength) {
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'maxLength',
                    condition: `LENGTH <= ${row.MaxLength}`,
                    errorMessage: `${row.Column} must not exceed ${row.MaxLength} characters`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange,
                    columnRange: row.ColumnRange,
                    cellRange: row.CellRange,
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
                
                if (row.Minimum) {
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'minimum',
                    condition: `VALUE >= ${row.Minimum}`,
                    errorMessage: `${row.Column} must be at least ${row.Minimum}`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange,
                    columnRange: row.ColumnRange,
                    cellRange: row.CellRange,
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
                
                if (row.Maximum) {
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'maximum',
                    condition: `VALUE <= ${row.Maximum}`,
                    errorMessage: `${row.Column} must not exceed ${row.Maximum}`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange,
                    columnRange: row.ColumnRange,
                    cellRange: row.CellRange,
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
                
                if (row.Pattern) {
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'pattern',
                    condition: `REGEX("${row.Pattern}")`,
                    errorMessage: `${row.Column} format is invalid`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange,
                    columnRange: row.ColumnRange,
                    cellRange: row.CellRange,
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
                
                if (row.EnumValues) {
                  const enumValues = row.EnumValues.split(',').map(v => v.trim());
                  rules.push({
                    templateId,
                    field,
                    ruleType: 'enum',
                    condition: `VALUE IN [${enumValues.map(v => `"${v}"`).join(', ')}]`,
                    errorMessage: `${row.Column} must be one of: ${enumValues.join(', ')}`,
                    severity: 'error',
                    isActive: true,
                    rowRange: row.RowRange,
                    columnRange: row.ColumnRange,
                    cellRange: row.CellRange,
                    applyToAllRows: row.ApplyToAllRows === 'true'
                  });
                }
              } else if (ruleType === 'cell') {
                // Cell-specific validation rule using Column + Row combination
                let cellReference = row.CellRange;
                if (!cellReference && row.Column && row.Row) {
                  // Build cell reference from Column + Row (e.g., A + 1 = A1)
                  cellReference = `${row.Column}${row.Row}`;
                }
                const field = cellReference || `${row.SheetName}.${row.Column}`;
                
                rules.push({
                  templateId,
                  field,
                  ruleType: row.Required === 'true' ? 'required' : 'custom',
                  condition: row.Expression || 'NOT_EMPTY',
                  errorMessage: row.Description || `Cell ${cellReference} validation failed`,
                  severity: row.Severity || 'error',
                  isActive: true,
                  rowRange: row.RowRange || row.Row,
                  columnRange: row.ColumnRange || row.Column,
                  cellRange: cellReference,
                  applyToAllRows: row.ApplyToAllRows === 'true'
                });
              } else if (ruleType === 'range') {
                // Range validation using Column range + Row range combination
                let cellRange = row.CellRange;
                if (!cellRange && row.ColumnRange && row.RowRange) {
                  // Build cell range from ColumnRange + RowRange (e.g., A-C + 2-5 = A2:C5)
                  const [startCol, endCol] = row.ColumnRange.includes('-') ? row.ColumnRange.split('-') : [row.ColumnRange, row.ColumnRange];
                  const [startRow, endRow] = row.RowRange.includes('-') ? row.RowRange.split('-') : [row.RowRange, row.RowRange];
                  cellRange = `${startCol}${startRow}:${endCol}${endRow}`;
                }
                const field = cellRange || `${row.SheetName}.${row.ColumnRange}`;
                
                rules.push({
                  templateId,
                  field,
                  ruleType: row.Required === 'true' ? 'required' : 'range',
                  condition: row.Expression || 'NOT_EMPTY',
                  errorMessage: row.Description || `Range ${cellRange} validation failed`,
                  severity: row.Severity || 'error',
                  isActive: true,
                  rowRange: row.RowRange,
                  columnRange: row.ColumnRange,
                  cellRange: cellRange,
                  applyToAllRows: row.ApplyToAllRows === 'true'
                });
              } else if (ruleType === 'cross_field') {
                // Cross-field validation rule
                rules.push({
                  templateId,
                  field: row.SheetName,
                  ruleType: 'crossField',
                  condition: row.Expression,
                  errorMessage: row.Description,
                  severity: row.Severity || 'error',
                  isActive: true,
                  cellRange: row.CellRange
                });
              } else if (ruleType === 'global') {
                // Global validation rule
                rules.push({
                  templateId,
                  field: 'GLOBAL',
                  ruleType: 'global',
                  condition: row.Expression,
                  errorMessage: row.Description,
                  severity: row.Severity || 'error',
                  isActive: true,
                  cellRange: row.CellRange
                });
              }
            }
            
            resolve({ rules, metadata, errors });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  /**
   * Parse Excel rules format
   */
  private static async parseExcelRules(
    filePath: string,
    templateId: number
  ): Promise<ParsedValidationRules> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const rules: ValidationRule[] = [];
    const errors: string[] = [];
    let metadata = {};
    
    // Parse metadata sheet
    const metadataSheet = workbook.getWorksheet('Metadata');
    if (metadataSheet) {
      metadata = this.parseMetadataSheet(metadataSheet);
    }
    
    // Parse column validations sheet
    const columnValidationsSheet = workbook.getWorksheet('Column Validations');
    if (columnValidationsSheet) {
      const columnRules = this.parseColumnValidationsSheet(columnValidationsSheet, templateId);
      rules.push(...columnRules);
    }
    
    // Parse cross-field validations sheet
    const crossFieldSheet = workbook.getWorksheet('Cross-Field Validations');
    if (crossFieldSheet) {
      const crossFieldRules = this.parseCrossFieldValidationsSheet(crossFieldSheet, templateId);
      rules.push(...crossFieldRules);
    }
    
    return { rules, metadata, errors };
  }

  /**
   * Parse legacy TXT format for backward compatibility
   */
  private static async parseLegacyTxtRules(
    filePath: string,
    templateId: number
  ): Promise<ParsedValidationRules> {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const rules: ValidationRule[] = [];
    const errors: string[] = [];
    const metadata = {};
    
    for (const line of lines) {
      try {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const field = parts[0].trim();
          const condition = parts[1].trim();
          
          rules.push({
            templateId,
            field,
            ruleType: 'legacy',
            condition,
            errorMessage: `Validation failed for ${field}`,
            severity: 'error',
            isActive: true
          });
        }
      } catch (error) {
        errors.push(`Failed to parse line: ${line}`);
      }
    }
    
    return { rules, metadata, errors };
  }

  /**
   * Helper method to parse JSON Schema object
   */
  private static async parseJsonSchemaObject(
    schema: any,
    templateId: number
  ): Promise<ParsedValidationRules> {
    // Create a temporary JSON file and parse it
    const tempContent = JSON.stringify(schema);
    const tempFilePath = `/tmp/temp_schema_${Date.now()}.json`;
    
    fs.writeFileSync(tempFilePath, tempContent);
    
    try {
      const result = await this.parseJsonSchema(tempFilePath, templateId);
      fs.unlinkSync(tempFilePath); // Clean up
      return result;
    } catch (error) {
      fs.unlinkSync(tempFilePath); // Clean up
      throw error;
    }
  }

  /**
   * Parse metadata sheet from Excel
   */
  private static parseMetadataSheet(sheet: ExcelJS.Worksheet): any {
    const metadata: any = {};
    
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const field = row.getCell(1).value?.toString();
        const value = row.getCell(2).value?.toString();
        
        if (field && value) {
          metadata[field.toLowerCase().replace(/\s+/g, '')] = value;
        }
      }
    });
    
    return metadata;
  }

  /**
   * Parse column validations sheet from Excel
   */
  private static parseColumnValidationsSheet(
    sheet: ExcelJS.Worksheet,
    templateId: number
  ): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const sheetName = row.getCell(1).value?.toString();
        const column = row.getCell(2).value?.toString();
        const dataType = row.getCell(3).value?.toString();
        const required = row.getCell(4).value?.toString() === 'TRUE';
        const minLength = row.getCell(5).value?.toString();
        const maxLength = row.getCell(6).value?.toString();
        const minimum = row.getCell(7).value?.toString();
        const maximum = row.getCell(8).value?.toString();
        const enumValues = row.getCell(9).value?.toString();
        const pattern = row.getCell(10).value?.toString();
        
        if (sheetName && column) {
          const field = `${sheetName}.${column}`;
          
          if (required) {
            rules.push({
              templateId,
              field,
              ruleType: 'required',
              condition: 'NOT_EMPTY',
              errorMessage: `${column} is required in ${sheetName}`,
              severity: 'error',
              isActive: true
            });
          }
          
          if (dataType) {
            rules.push({
              templateId,
              field,
              ruleType: 'dataType',
              condition: `TYPE_IS_${dataType.toUpperCase()}`,
              errorMessage: `${column} must be of type ${dataType}`,
              severity: 'error',
              isActive: true
            });
          }
          
          // Add other validations...
        }
      }
    });
    
    return rules;
  }

  /**
   * Parse cross-field validations sheet from Excel
   */
  private static parseCrossFieldValidationsSheet(
    sheet: ExcelJS.Worksheet,
    templateId: number
  ): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const name = row.getCell(1).value?.toString();
        const description = row.getCell(2).value?.toString();
        const expression = row.getCell(3).value?.toString();
        const severity = row.getCell(4).value?.toString() || 'error';
        const applicableSheets = row.getCell(5).value?.toString();
        
        if (name && expression) {
          rules.push({
            templateId,
            field: applicableSheets || 'GLOBAL',
            ruleType: 'crossField',
            condition: expression,
            errorMessage: description || name,
            severity: severity as 'error' | 'warning',
            isActive: true
          });
        }
      }
    });
    
    return rules;
  }
}

export default ModernValidationRulesParser;