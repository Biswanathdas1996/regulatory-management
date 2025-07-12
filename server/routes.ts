import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import { storage } from "./storage";
import { FileProcessor } from "./services/fileProcessor";
import { ValidationRulesParser } from "./services/validationRulesParser";
import { ValidationEngine } from "./services/validationEngine";
import { insertTemplateSchema, insertTemplateSheetSchema, templateTypes } from "@shared/schema";
import { z } from "zod";

// Extend Request type to include file property
interface MulterRequest extends Request {
  file?: any;
  files?: any;
}

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, 'server/uploads/');
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel, CSV, and TXT files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get templates with validation rules
  app.get("/api/templates/with-rules", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      // Filter templates that have validation rules
      const templatesWithRules = templates.filter(t => t.validationRulesPath);
      res.json(templatesWithRules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get template by ID
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Upload and process template with validation rules
  app.post("/api/templates/upload", upload.fields([
    { name: 'template', maxCount: 1 },
    { name: 'validationRules', maxCount: 1 }
  ]), async (req: MulterRequest, res) => {
    try {
      if (!req.files?.template?.[0]) {
        return res.status(400).json({ error: "No template file uploaded" });
      }

      const templateFile = req.files.template[0];
      const validationFile = req.files.validationRules?.[0];
      const { templateType, templateName } = req.body;
      
      // Validate template type
      if (!templateTypes.includes(templateType)) {
        return res.status(400).json({ error: "Invalid template type" });
      }

      // Validate template name
      if (!templateName || templateName.trim().length === 0) {
        return res.status(400).json({ error: "Template name is required" });
      }

      // Create template record
      const template = await storage.createTemplate({
        name: templateName.trim(),
        templateType,
        fileName: templateFile.originalname,
        filePath: templateFile.path,
        fileSize: templateFile.size,
        validationRulesPath: validationFile?.path
      });

      // Parse and store validation rules if provided
      if (validationFile) {
        try {
          const rules = await ValidationRulesParser.parseRulesFile(validationFile.path, template.id);
          if (rules.length > 0) {
            await storage.createValidationRules(rules);
          }
        } catch (parseError) {
          console.error("Failed to parse validation rules:", parseError);
          // Continue without validation rules
        }
      }

      // Start processing in the background
      processTemplateAsync(template.id).catch(error => {
        console.error(`Background processing failed for template ${template.id}:`, error);
      });

      res.json({ 
        message: "Template uploaded successfully", 
        templateId: template.id,
        template,
        hasValidationRules: !!validationFile
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload template" });
    }
  });

  // Get processing status
  app.get("/api/templates/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statuses = await storage.getProcessingStatus(id);
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processing status" });
    }
  });

  // Get template sheets
  app.get("/api/templates/:id/sheets", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sheets = await storage.getTemplateSheets(id);
      res.json(sheets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template sheets" });
    }
  });

  // Get template schemas
  app.get("/api/templates/:id/schemas", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schemas = await storage.getTemplateSchemas(id);
      res.json(schemas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template schemas" });
    }
  });

  // Get specific schema
  app.get("/api/templates/:id/schemas/:sheetId?", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sheetId = req.params.sheetId ? parseInt(req.params.sheetId) : undefined;
      const schema = await storage.getTemplateSchema(id, sheetId);
      
      if (!schema) {
        return res.status(404).json({ error: "Schema not found" });
      }
      
      res.json(schema);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schema" });
    }
  });

  // Delete template
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Trigger processing for a template (for manual processing)
  app.post("/api/templates/:id/process", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if template exists
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Start processing in background
      processTemplateAsync(id).catch(error => {
        console.error(`Background processing failed for template ${id}:`, error);
      });

      res.json({ 
        message: "Processing started", 
        templateId: id 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start processing" });
    }
  });

  // Get template types
  app.get("/api/template-types", (req, res) => {
    const types = [
      { value: "monthly-clearing", label: "Monthly Report - Clearing Corporation" },
      { value: "quarterly-capital", label: "Quarterly Reporting Format for Capital Market Intermediaries" },
      { value: "liabilities", label: "Report on Liabilities" },
      { value: "stock-mar", label: "Stock Exchange - Market Activity Report (MAR)" },
      { value: "stock-mdr", label: "Stock Exchange - Market Data Report (MDR)" },
      { value: "treasury", label: "Treasury Report" }
    ];
    res.json(types);
  });

  // System stats
  app.get("/api/stats", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      const totalTemplates = templates.length;
      const processed = templates.filter(t => t.status === "completed").length;
      const processing = templates.filter(t => t.status === "processing").length;
      const failed = templates.filter(t => t.status === "failed").length;

      res.json({
        totalTemplates,
        processed,
        processing,
        failed,
        averageConfidence: 94 // This could be calculated from actual schema data
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Download template file
  app.get("/api/templates/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.download(template.filePath, template.fileName);
    } catch (error) {
      res.status(500).json({ error: "Failed to download template" });
    }
  });

  // Get validation rules for a template (with optional sheet filtering)
  app.get("/api/templates/:id/validation-rules", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sheetId = req.query.sheetId ? parseInt(req.query.sheetId as string) : undefined;
      
      let rules = await storage.getValidationRules(id);
      
      // Filter by sheet if sheetId is provided
      if (sheetId !== undefined) {
        rules = rules.filter(rule => rule.sheetId === sheetId);
      }
      
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch validation rules" });
    }
  });

  // Create a new validation rule
  app.post("/api/templates/:id/validation-rules", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { sheetId, ruleType, field, condition, errorMessage, severity } = req.body;

      // Validate required fields
      if (!ruleType || !field || !condition || !errorMessage) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate rule type
      const validRuleTypes = ["required", "format", "range", "custom"];
      if (!validRuleTypes.includes(ruleType)) {
        return res.status(400).json({ error: "Invalid rule type" });
      }

      // Validate severity
      const validSeverities = ["error", "warning"];
      if (severity && !validSeverities.includes(severity)) {
        return res.status(400).json({ error: "Invalid severity" });
      }

      const rule = await storage.createValidationRule({
        templateId,
        sheetId: sheetId || null,
        ruleType,
        field,
        condition,
        errorMessage,
        severity: severity || "error"
      });

      res.json(rule);
    } catch (error) {
      console.error("Create validation rule error:", error);
      res.status(500).json({ error: "Failed to create validation rule" });
    }
  });

  // Update a validation rule
  app.put("/api/templates/:id/validation-rules/:ruleId", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const ruleId = parseInt(req.params.ruleId);
      const { ruleType, field, condition, errorMessage, severity } = req.body;

      // Validate required fields
      if (!ruleType || !field || !condition || !errorMessage) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if rule exists
      const existingRules = await storage.getValidationRules(templateId);
      const ruleExists = existingRules.some(r => r.id === ruleId);
      if (!ruleExists) {
        return res.status(404).json({ error: "Validation rule not found" });
      }

      // Delete old rule and create new one (since we don't have an update method)
      await storage.deleteValidationRules(templateId);
      
      // Re-create all rules except the one being updated
      const rulesToKeep = existingRules.filter(r => r.id !== ruleId);
      const updatedRules = [
        ...rulesToKeep.map(r => ({
          templateId: r.templateId,
          sheetId: r.sheetId,
          ruleType: r.ruleType,
          field: r.field,
          condition: r.condition,
          errorMessage: r.errorMessage,
          severity: r.severity
        })),
        {
          templateId,
          sheetId: req.body.sheetId || null,
          ruleType,
          field,
          condition,
          errorMessage,
          severity: severity || "error"
        }
      ];

      await storage.createValidationRules(updatedRules);
      res.json({ message: "Validation rule updated successfully" });
    } catch (error) {
      console.error("Update validation rule error:", error);
      res.status(500).json({ error: "Failed to update validation rule" });
    }
  });

  // Delete a validation rule
  app.delete("/api/templates/:id/validation-rules/:ruleId", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const ruleId = parseInt(req.params.ruleId);

      // Get existing rules
      const existingRules = await storage.getValidationRules(templateId);
      const ruleExists = existingRules.some(r => r.id === ruleId);
      
      if (!ruleExists) {
        return res.status(404).json({ error: "Validation rule not found" });
      }

      // Delete all rules and recreate without the deleted one
      await storage.deleteValidationRules(templateId);
      
      const rulesToKeep = existingRules
        .filter(r => r.id !== ruleId)
        .map(r => ({
          templateId: r.templateId,
          ruleType: r.ruleType,
          field: r.field,
          condition: r.condition,
          errorMessage: r.errorMessage,
          severity: r.severity
        }));

      if (rulesToKeep.length > 0) {
        await storage.createValidationRules(rulesToKeep);
      }

      res.json({ message: "Validation rule deleted successfully" });
    } catch (error) {
      console.error("Delete validation rule error:", error);
      res.status(500).json({ error: "Failed to delete validation rule" });
    }
  });

  // Bulk delete validation rules
  app.post("/api/templates/:id/validation-rules/bulk-delete", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { ruleIds } = req.body;

      if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
        return res.status(400).json({ error: "No rule IDs provided" });
      }

      // Get existing rules
      const existingRules = await storage.getValidationRules(templateId);
      
      // Delete all rules and recreate without the deleted ones
      await storage.deleteValidationRules(templateId);
      
      const rulesToKeep = existingRules
        .filter(r => !ruleIds.includes(r.id))
        .map(r => ({
          templateId: r.templateId,
          ruleType: r.ruleType,
          field: r.field,
          condition: r.condition,
          errorMessage: r.errorMessage,
          severity: r.severity
        }));

      if (rulesToKeep.length > 0) {
        await storage.createValidationRules(rulesToKeep);
      }

      res.json({ message: `${ruleIds.length} rules deleted successfully` });
    } catch (error) {
      console.error("Bulk delete validation rules error:", error);
      res.status(500).json({ error: "Failed to delete rules" });
    }
  });

  // Import validation rules from text
  app.post("/api/templates/:id/validation-rules/import", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { rulesText } = req.body;

      if (!rulesText || typeof rulesText !== 'string') {
        return res.status(400).json({ error: "Invalid rules text provided" });
      }

      // Parse the rules text
      const parsedRules = ValidationRulesParser.parseRulesContent(rulesText);
      
      if (parsedRules.length === 0) {
        return res.status(400).json({ error: "No valid rules found in the provided text" });
      }

      // Create the rules
      const rules = parsedRules.map(rule => ({
        templateId,
        ...rule
      }));

      await storage.createValidationRules(rules);

      res.json({ 
        message: "Rules imported successfully", 
        imported: rules.length 
      });
    } catch (error) {
      console.error("Import validation rules error:", error);
      res.status(500).json({ error: "Failed to import validation rules" });
    }
  });

  // Generate validation rules for a specific sheet using AI
  app.post("/api/templates/:templateId/sheets/:sheetId/generate-rules", async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const sheetId = parseInt(req.params.sheetId);
      const { sheetData, sheetName, sheetIndex } = req.body;

      if (!sheetData || !sheetName) {
        return res.status(400).json({ error: "Sheet data and name are required" });
      }

      // Prepare a simplified data sample for AI analysis
      const sampleData = sheetData.data.slice(0, 20); // Take first 20 rows as sample
      
      // Use Gemini AI to analyze the sheet and generate validation rules
      const analysisPrompt = `
Analyze this Excel sheet data and generate validation rules.

Sheet Name: ${sheetName}
Sample Data (first 20 rows):
${JSON.stringify(sampleData, null, 2)}

Based on the data patterns, headers, and values, generate validation rules following these types:
1. "required" - For fields that must have values
2. "format" - For fields with specific patterns (email, phone, dates, etc.)
3. "range" - For numeric fields with min/max values
4. "custom" - For other business logic validations

For each rule, provide:
- field: The column name or cell reference (e.g., "Company Name" or "A1:A100")
- ruleType: One of the types above
- condition: The validation condition (e.g., "not_empty", "^\\d{10}$" for phone, "min:0,max:100")
- errorMessage: A clear error message
- severity: "error" or "warning"

Return the response as a JSON array of validation rules.
Only return the JSON array, no additional text.
`;

      const genai = await import('@google/genai');
      const genAI = new genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const result = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: analysisPrompt
      });
      
      const text = result.text || '';
      
      if (!text) {
        throw new Error('No response from AI model');
      }
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response - no valid JSON array found');
      }
      
      const generatedRules = JSON.parse(jsonMatch[0]);
      
      // Save the generated rules to database
      const rulesToCreate = generatedRules.map((rule: any) => ({
        templateId,
        sheetId,
        ruleType: rule.ruleType,
        field: rule.field,
        condition: rule.condition,
        errorMessage: rule.errorMessage,
        severity: rule.severity || 'error'
      }));
      
      await storage.createValidationRules(rulesToCreate);
      
      res.json({ 
        success: true,
        rulesCount: rulesToCreate.length,
        rules: rulesToCreate
      });
    } catch (error) {
      console.error("Generate validation rules error:", error);
      res.status(500).json({ error: "Failed to generate validation rules" });
    }
  });

  // Submit a filled template for validation
  app.post("/api/submissions/upload", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { templateId } = req.body;
      const userId = 1; // TODO: Get from authenticated user
      
      if (!templateId) {
        return res.status(400).json({ error: "Template ID is required" });
      }

      // Create submission record
      const submission = await storage.createSubmission({
        templateId: parseInt(templateId),
        userId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size
      });

      // Validate submission in background
      validateSubmissionAsync(submission.id);

      res.json({ 
        message: "Submission uploaded successfully", 
        submissionId: submission.id,
        submission 
      });
    } catch (error) {
      console.error("Submission error:", error);
      res.status(500).json({ error: "Failed to upload submission" });
    }
  });

  // Get user submissions
  app.get("/api/submissions", async (req, res) => {
    try {
      const { userId, templateId } = req.query;
      const submissions = await storage.getSubmissions(
        userId ? parseInt(userId as string) : undefined,
        templateId ? parseInt(templateId as string) : undefined
      );
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Get submission details
  app.get("/api/submissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getSubmission(id);
      
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  // Get validation results for a submission
  app.get("/api/submissions/:id/results", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const results = await storage.getValidationResults(id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch validation results" });
    }
  });

  // Generate example validation rules file
  app.get("/api/validation-rules/example", (req, res) => {
    const example = ValidationRulesParser.generateExampleRules();
    res.type('text/plain').send(example);
  });

  // Get Excel data for viewer
  app.get("/api/templates/:id/excel-data", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Get the sheets for this template
      const sheets = await storage.getTemplateSheets(id);
      
      if (sheets.length === 0) {
        return res.json([]);
      }

      // Parse the Excel file to get data
      const workbook = new ExcelJS.Workbook();
      const ext = path.extname(template.filePath).toLowerCase();
      
      if (ext === '.xlsx' || ext === '.xls') {
        await workbook.xlsx.readFile(template.filePath);
        
        const sheetsData: any[] = [];
        
        workbook.eachSheet((worksheet, sheetId) => {
          const sheetData: any[][] = [];
          const mergedCells: any[] = [];
          
          // Get merged cell ranges using the model property
          if (worksheet.model && worksheet.model.merges) {
            worksheet.model.merges.forEach((merge: string) => {
              // Parse merge range (e.g., "A1:B2")
              const match = merge.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
              if (match) {
                // Convert column letters to index (handle multi-character columns)
                const colToIndex = (col: string) => {
                  let index = 0;
                  for (let i = 0; i < col.length; i++) {
                    index = index * 26 + (col.charCodeAt(i) - 64);
                  }
                  return index - 1;
                };
                
                const startCol = colToIndex(match[1]);
                const startRow = parseInt(match[2]) - 1;
                const endCol = colToIndex(match[3]);
                const endRow = parseInt(match[4]) - 1;
                
                mergedCells.push({
                  top: startRow,
                  left: startCol,
                  bottom: endRow,
                  right: endCol
                });
              }
            });
          }
          
          // Convert worksheet to array format
          const maxRow = worksheet.rowCount || 0;
          const maxCol = worksheet.columnCount || 0;
          
          for (let rowNumber = 1; rowNumber <= maxRow; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const rowData: any[] = [];
            
            for (let colNumber = 1; colNumber <= maxCol; colNumber++) {
              const cell = row.getCell(colNumber);
              
              // Check if this cell is part of a merged range
              let isMerged = false;
              let mergeInfo = null;
              
              for (const merge of mergedCells) {
                if (rowNumber - 1 >= merge.top && rowNumber - 1 <= merge.bottom &&
                    colNumber - 1 >= merge.left && colNumber - 1 <= merge.right) {
                  isMerged = true;
                  mergeInfo = {
                    ...merge,
                    isTopLeft: rowNumber - 1 === merge.top && colNumber - 1 === merge.left
                  };
                  break;
                }
              }
              
              // Extract cell styling safely
              let backgroundColor = null;
              let textColor = null;
              
              if (cell.style?.fill && 'type' in cell.style.fill) {
                const fill = cell.style.fill as any;
                if (fill.type === 'pattern' && fill.fgColor?.argb) {
                  backgroundColor = `#${fill.fgColor.argb.substring(2)}`;
                }
              }
              
              if (cell.style?.font?.color && 'argb' in cell.style.font.color) {
                const color = cell.style.font.color as any;
                if (color.argb) {
                  textColor = `#${color.argb.substring(2)}`;
                }
              }
              
              rowData.push({
                value: cell.value !== undefined && cell.value !== null ? String(cell.value) : "",
                merged: isMerged,
                mergeInfo: mergeInfo,
                style: {
                  backgroundColor,
                  color: textColor,
                  fontWeight: cell.style?.font?.bold ? 'bold' : 'normal',
                  textAlign: cell.style?.alignment?.horizontal || 'left',
                  verticalAlign: cell.style?.alignment?.vertical || 'middle'
                }
              });
            }
            sheetData.push(rowData);
          }
          
          sheetsData.push({
            sheetName: worksheet.name,
            data: sheetData,
            mergedCells: mergedCells
          });
        });
        
        res.json(sheetsData);
      } else if (ext === '.csv') {
        // For CSV files, create a single sheet
        const data: any[][] = [];
        const stream = fs.createReadStream(template.filePath);
        
        stream
          .pipe(csv())
          .on('data', (row: any) => {
            const rowData = Object.values(row).map((value: any) => ({
              value: value !== undefined && value !== null ? String(value) : ""
            }));
            data.push(rowData);
          })
          .on('end', () => {
            res.json([{
              sheetName: 'Sheet1',
              data
            }]);
          })
          .on('error', (error) => {
            console.error('CSV parsing error:', error);
            res.status(500).json({ error: "Failed to parse CSV file" });
          });
      } else {
        res.status(400).json({ error: "Unsupported file format" });
      }
    } catch (error) {
      console.error("Excel data fetch error:", error);
      res.status(500).json({ error: "Failed to fetch Excel data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background validation function
async function validateSubmissionAsync(submissionId: number) {
  try {
    const submission = await storage.getSubmission(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Update status to validating
    await storage.updateSubmissionStatus(submissionId, "validating");

    // Get validation rules for the template
    const rules = await storage.getValidationRules(submission.templateId);
    
    if (rules.length === 0) {
      // No validation rules - mark as passed
      await storage.updateSubmissionStatus(submissionId, "passed", 0, 0);
      return;
    }

    // Run validation with progress tracking
    const context = {
      submissionId,
      filePath: submission.filePath,
      rules,
      onProgress: async (progress: number, message?: string) => {
        // You could store progress in database or use WebSockets for real-time updates
        console.log(`Validation progress for submission ${submissionId}: ${progress}% - ${message}`);
      }
    };

    const { results, summary } = await ValidationEngine.validateSubmission(context);
    
    // Store validation results in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await storage.createValidationResults(batch);
    }

    // Update submission status
    const status = summary.errors > 0 ? "failed" : "passed";
    await storage.updateSubmissionStatus(
      submissionId, 
      status, 
      summary.errors, 
      summary.warnings
    );

  } catch (error) {
    console.error("Validation error:", error);
    await storage.updateSubmissionStatus(submissionId, "failed");
  }
}

// Background processing function
async function processTemplateAsync(templateId: number) {
  let currentStep = "extraction";
  
  try {
    console.log(`Starting processing for template ${templateId}`);
    
    const template = await storage.getTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Update extraction status to in progress
    await storage.updateProcessingStatus(templateId, "extraction", "in_progress", "Starting sheet extraction", 10);
    await storage.updateTemplateStatus(templateId, "processing");

    console.log(`Processing file: ${template.filePath}`);

    // Process file and extract data
    const result = await FileProcessor.processFile(template.filePath, templateId);
    
    if (!result.success) {
      console.error(`File processing failed: ${result.error}`);
      await storage.updateProcessingStatus(templateId, "extraction", "failed", result.error || "Failed to process file");
      throw new Error(result.error);
    }

    console.log(`Extracted ${result.sheets?.length} sheets`);

    // Store extracted sheets
    if (result.sheets && result.sheets.length > 0) {
      let sheetProgress = 50;
      for (let i = 0; i < result.sheets.length; i++) {
        const sheet = result.sheets[i];
        await storage.createTemplateSheet({
          templateId,
          sheetName: sheet.name,
          sheetIndex: sheet.index,
          dataPointCount: sheet.dataPointCount,
          extractedData: {
            data: sheet.data,
            tabularTemplates: sheet.tabularTemplates || []
          }
        });
        
        // Update progress for each sheet stored
        sheetProgress = 50 + Math.round((i + 1) / result.sheets.length * 40);
        await storage.updateProcessingStatus(
          templateId, 
          "extraction", 
          "in_progress", 
          `Storing sheet ${i + 1}/${result.sheets.length}: ${sheet.name}`, 
          sheetProgress
        );
      }
    }

    // Update extraction as complete
    await storage.updateProcessingStatus(templateId, "extraction", "completed", `Successfully extracted ${result.sheets?.length || 0} sheets`, 100);

    // Generate schemas with AI
    currentStep = "ai_processing";
    await storage.updateProcessingStatus(templateId, "ai_processing", "in_progress", "Starting AI schema generation", 0);
    
    try {
      await FileProcessor.generateSchemas(templateId);
      await storage.updateTemplateStatus(templateId, "completed");
      await storage.updateProcessingStatus(templateId, "schema_generation", "completed", "All processing completed successfully", 100);
    } catch (aiError) {
      console.error("AI processing error:", aiError);
      await storage.updateProcessingStatus(
        templateId, 
        "ai_processing", 
        "failed", 
        aiError instanceof Error ? aiError.message : "AI processing failed"
      );
      throw aiError;
    }

  } catch (error) {
    console.error("Template processing failed:", error);
    await storage.updateTemplateStatus(templateId, "failed");
    
    // Update the appropriate step as failed
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await storage.updateProcessingStatus(templateId, currentStep, "failed", errorMessage);
    
    // If we haven't started AI processing yet, mark it as pending
    if (currentStep === "extraction") {
      await storage.updateProcessingStatus(templateId, "ai_processing", "pending", "Waiting for extraction to complete");
      await storage.updateProcessingStatus(templateId, "schema_generation", "pending", "Waiting for AI processing");
    }
  }
}
