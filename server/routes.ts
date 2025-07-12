import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { FileProcessor } from "./services/fileProcessor";
import { insertTemplateSchema, insertTemplateSheetSchema, templateTypes } from "@shared/schema";
import { z } from "zod";

// Extend Request type to include file property
interface MulterRequest extends Request {
  file?: any;
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
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
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

  // Upload and process template
  app.post("/api/templates/upload", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

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
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size
      });

      // Initialize processing status
      await storage.createProcessingStatus({
        templateId: template.id,
        step: "upload",
        status: "completed",
        message: "File uploaded successfully",
        progress: 100
      });

      await storage.createProcessingStatus({
        templateId: template.id,
        step: "extraction",
        status: "pending",
        message: "Waiting to start extraction",
        progress: 0
      });

      // Start processing in background
      processTemplateAsync(template.id);

      res.json({ 
        message: "Template uploaded successfully", 
        templateId: template.id,
        template 
      });
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processTemplateAsync(templateId: number) {
  try {
    const template = await storage.getTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await storage.updateTemplateStatus(templateId, "processing");

    // Process file and extract data
    const result = await FileProcessor.processFile(template.filePath, templateId);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    // Store extracted sheets
    if (result.sheets) {
      for (const sheet of result.sheets) {
        await storage.createTemplateSheet({
          templateId,
          sheetName: sheet.name,
          sheetIndex: sheet.index,
          dataPointCount: sheet.dataPointCount,
          extractedData: sheet.data
        });
      }
    }

    // Generate schemas with AI
    await FileProcessor.generateSchemas(templateId);

  } catch (error) {
    console.error("Template processing failed:", error);
    await storage.updateTemplateStatus(templateId, "failed");
  }
}
