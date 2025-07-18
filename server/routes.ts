import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import { storage } from "./storage";
import { FileProcessor } from "./services/fileProcessor";
import { ModernValidationRulesParser } from "../validation/ModernValidationRulesParser";
import { ValidationEngine } from "./services/validationEngine";
import { ModernValidationEngine } from "../validation/ModernValidationEngine";
import { xbrlProcessor } from "./xbrl-processor";
import {
  insertTemplateSchema,
  insertTemplateSheetSchema,
  templateTypes,
  validationResults,
  comments,
  submissions,
  validationRules,
  templateSchemas,
  templateSheets,
  processingStatus,
  templates,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "./db";

// Extend Request type to include authenticated user property
interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string; role: string; category?: string };
}

// Extend Request type to include file property
interface MulterRequest extends AuthenticatedRequest {
  file?: any;
  files?: any;
}

// Store generation progress
const generationProgress = new Map<
  string,
  {
    templateId: number;
    sheetId: number;
    currentChunk: number;
    totalChunks: number;
    status: "processing" | "completed" | "error";
    message?: string;
  }
>();

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, "server/uploads/");
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Configure multer for validation file uploads
const validationStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, "validation/");
  },
  filename: (req: any, file: any, cb: any) => {
    const templateId = req.params.templateId;
    const timestamp = Date.now();
    cb(
      null,
      `template-${templateId}-validation-${timestamp}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [".xlsx", ".xls", ".csv", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only Excel, CSV, and TXT files are allowed."
        )
      );
    }
  },
});

const validationUpload = multer({
  storage: validationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for validation files
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [".txt", ".xlsx", ".xls", ".csv", ".json", ".yaml", ".yml"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only TXT, Excel, CSV, JSON, and YAML files are allowed for validation rules."
        )
      );
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  app.use((req: AuthenticatedRequest, res, next) => {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      req.user = sessionUser;
    }
    next();
  });

  // Add authentication middleware checking function
  function requireAuth(req: AuthenticatedRequest, res: any, next: any) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  }

  // Admin middleware to check if user is admin
  function requireAdmin(req: AuthenticatedRequest, res: any, next: any) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role !== "IFSCA" && req.user.role !== "IFSCA_USER") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }

  function requireSuperAdmin(req: AuthenticatedRequest, res: any, next: any) {
    console.log("requireSuperAdmin middleware - user:", req.user);
    if (!req.user) {
      console.log("requireSuperAdmin: No user found");
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role !== "IFSCA") {
      console.log(
        "requireSuperAdmin: User role is not IFSCA:",
        req.user.role
      );
      return res.status(403).json({ error: "IFSCA access required" });
    }
    console.log("requireSuperAdmin: Access granted");
    next();
  }

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userData = {
        id: user.id,
        username: user.username,
        role: user.role,
        category: user.category,
      };

      (req.session as any).user = userData;
      res.json(userData);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Failed to logout" });
      } else {
        res.json({ message: "Successfully logged out" });
      }
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.post("/api/auth/logout", async (req: AuthenticatedRequest, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // User management endpoints (Admin only)
  // Get all users (Admin only)
  app.get(
    "/api/admin/users",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        interface User {
          id: number;
          username: string;
          role: string;
          category?: string | null;
          createdAt: Date;
          password?: string;
          updatedAt?: Date;
        }

        let users: User[] = [];

        // Filter users based on role
        if (req.user?.role === "IFSCA") {
          // Super admin sees all users
          const allUsers = await storage.getAllUsers();
          users = allUsers.map((user) => ({
            ...user,
            category: user.category?.toString() || null,
          }));
        } else if (req.user?.role === "IFSCA_USER") {
          // IFSCA user only sees users in their category
          const allUsers = await storage.getAllUsers();
          const userCategoryId = req.user?.category
            ? parseInt(req.user.category)
            : null;
          users = allUsers
            .filter((user) => user.category === userCategoryId)
            .map((user) => ({
              ...user,
              category: user.category?.toString() || null,
            }));
        } else {
          // Other roles get an empty array or handle accordingly
          users = [];
        }
        // Don't return passwords and add category data
        const safeUsers = await Promise.all(
          users?.map(async (user) => {
            let categoryData = null;
            if (user.category) {
              const categories = await storage.getCategories();
              categoryData = categories.find(
                (cat) => cat.id === parseInt(user.category as string)
              );
            }
            return {
              id: user.id,
              username: user.username,
              role: user.role,
              category: user.category,
              categoryData,
              createdAt: user.createdAt,
            };
          }) || []
        );
        res.json(safeUsers);
      } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    }
  );

  // Create new user (Admin only)
  app.post(
    "/api/admin/users",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { username, password, role } = req.body;

        // Validate required fields
        if (!username || !password) {
          return res
            .status(400)
            .json({ error: "Username and password are required" });
        }

        // Validate username format
        if (username.length < 3 || username.length > 50) {
          return res.status(400).json({
            error: "Username must be between 3 and 50 characters",
          });
        }

        // Validate password strength
        if (password.length < 6) {
          return res
            .status(400)
            .json({ error: "Password must be at least 6 characters long" });
        }

        // Check if username already exists
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(409).json({ error: "Username already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Set role to "user" and category same as current IFSCA user
        const userCategory = req.user?.category || null;

        // Create user
        const newUser = await storage.createUser({
          username,
          password: hashedPassword,
          role: role,
          category: userCategory ? parseInt(userCategory) : null,
        });

        // Return user without password
        res.status(201).json({
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          category: newUser.category,
          message: "User created successfully",
        });
      } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  );

  // Update user (Admin only)
  app.put(
    "/api/admin/users/:id",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { username, password, role } = req.body;

        // Check if user exists
        const existingUser = await storage.getUser(userId);
        if (!existingUser) {
          return res.status(404).json({ error: "User not found" });
        }

        // Prepare update data
        const updateData: Partial<any> = {};

        if (username !== undefined) {
          if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
              error: "Username must be between 3 and 50 characters",
            });
          }

          // Check if new username is already taken by another user
          const userWithUsername = await storage.getUserByUsername(username);
          if (userWithUsername && userWithUsername.id !== userId) {
            return res.status(409).json({ error: "Username already exists" });
          }

          updateData.username = username;
        }

        if (password !== undefined) {
          if (password.length < 6) {
            return res
              .status(400)
              .json({ error: "Password must be at least 6 characters long" });
          }
          updateData.password = await bcrypt.hash(password, 10);
        }

        if (role !== undefined) {
          updateData.role = role === 1 ? 1 : 0; // Frontend sends 0 or 1
        }

        // Update user
        const updatedUser = await storage.updateUser(userId, updateData);

        // Return user without password
        res.json({
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role || 0, // Keep as number: 0 for user, 1 for admin
          message: "User updated successfully",
        });
      } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  );

  // Delete user (Admin only)
  app.delete(
    "/api/admin/users/:id",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = parseInt(req.params.id);

        // Check if user exists
        const existingUser = await storage.getUser(userId);
        if (!existingUser) {
          return res.status(404).json({ error: "User not found" });
        }

        // Prevent admin from deleting themselves
        if (req.user!.id === userId) {
          return res
            .status(400)
            .json({ error: "Cannot delete your own account" });
        }

        // Check if user has submissions - we might want to prevent deletion or handle cleanup
        const userSubmissions = await storage.getSubmissions(userId);
        if (userSubmissions.length > 0) {
          return res.status(400).json({
            error: `Cannot delete user with ${userSubmissions.length} submissions. Please transfer or delete submissions first.`,
          });
        }

        // Delete user
        await storage.deleteUser(userId);

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: "Failed to delete user" });
      }
    }
  );

  // Excel Analysis endpoint for admin
  app.post(
    "/api/admin/excel-analysis",
    requireAuth,
    requireAdmin,
    upload.single("excel"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No Excel file uploaded" });
        }

        const file = req.file;
        const filePath = file.path;

        // Validate file type
        const allowedExtensions = [".xlsx", ".xls"];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
          // Clean up uploaded file
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error("Failed to cleanup invalid file:", cleanupError);
          }
          return res.status(400).json({
            error: "Please upload an Excel file (.xlsx or .xls)",
          });
        }

        console.log(`Analyzing Excel file: ${file.originalname}`);

        // Read the Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const analysisData = {
          filename: file.originalname,
          sheets: [] as any[],
          totalSheets: workbook.worksheets.length,
          analysisTimestamp: new Date().toISOString(),
        };

        // Process each worksheet
        workbook.worksheets.forEach((worksheet, sheetIndex) => {
          const sheetData = {
            name: worksheet.name,
            index: sheetIndex,
            rowCount: worksheet.rowCount,
            columnCount: worksheet.columnCount,
            cells: [] as any[],
            mergedCells: [] as any[],
          };

          // Get merged cells information (simplified for now)
          // Note: ExcelJS merged cells API varies by version, skipping for basic functionality
          // This can be enhanced later if needed

          // Process each cell with data
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
              const cellData: any = {
                value: cell.value,
                position: {
                  row: rowNumber,
                  column: colNumber,
                  columnLetter: String.fromCharCode(64 + colNumber), // Convert to A, B, C, etc.
                },
                dataType: typeof cell.value,
                mergeInfo: {
                  isMerged: cell.isMerged || false,
                },
              };

              // Adjust column letter for numbers > 26
              if (colNumber > 26) {
                const firstLetter = Math.floor((colNumber - 1) / 26);
                const secondLetter = ((colNumber - 1) % 26) + 1;
                cellData.position.columnLetter =
                  String.fromCharCode(64 + firstLetter) +
                  String.fromCharCode(64 + secondLetter);
              }

              // Determine more specific data types
              if (cell.value instanceof Date) {
                cellData.dataType = "date";
              } else if (
                typeof cell.value === "object" &&
                cell.value !== null
              ) {
                if ((cell.value as any).formula) {
                  cellData.dataType = "formula";
                  cellData.formula = (cell.value as any).formula;
                } else if ((cell.value as any).hyperlink) {
                  cellData.dataType = "hyperlink";
                  cellData.hyperlink = (cell.value as any).hyperlink;
                } else if ((cell.value as any).text) {
                  cellData.dataType = "rich_text";
                  cellData.value = (cell.value as any).text;
                }
              }

              // Check if this cell is part of a merged range (simplified)
              // For now, we'll just mark if the cell appears to be merged based on ExcelJS
              if (cell.isMerged) {
                cellData.mergeInfo.isMerged = true;
                // Note: Parent detection can be enhanced later
              }

              // Add style information if available
              if (cell.style) {
                cellData.style = {
                  font: cell.font,
                  fill: cell.fill,
                  border: cell.border,
                  alignment: cell.alignment,
                };
              }

              sheetData.cells.push(cellData);
            });
          });

          analysisData.sheets.push(sheetData);
        });

        // Clean up uploaded file
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error("Failed to cleanup file:", cleanupError);
        }

        console.log(`Excel analysis completed for ${file.originalname}`);
        console.log(
          `Total sheets: ${
            analysisData.totalSheets
          }, Total cells: ${analysisData.sheets.reduce(
            (acc, sheet) => acc + sheet.cells.length,
            0
          )}`
        );

        res.json(analysisData);
      } catch (error) {
        console.error("Excel analysis error:", error);

        // Clean up uploaded file on error
        if (req.file?.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error("Failed to cleanup file on error:", cleanupError);
          }
        }

        res.status(500).json({
          error: "Failed to analyze Excel file",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Get all templates (filtered by user category for IFSCA users and reporting entities)
  app.get("/api/templates", async (req: AuthenticatedRequest, res) => {
    try {
      const templates = await storage.getTemplates();

      // Filter templates based on user role and category
      let filteredTemplates = templates;

      if (req.user && req.user.category) {
        // IFSCA users and reporting entities can only see templates for their category
        if (
          req.user.role === "IFSCA_USER" ||
          req.user.role === "REPORTING_ENTITY"
        ) {
          // Convert user category to number for comparison
          const userCategoryId = parseInt(req.user.category);
          filteredTemplates = templates.filter(
            (template) => template.category === userCategoryId
          );
        }
      }
      // Super admins see all templates

      res.json(filteredTemplates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get templates with validation rules (filtered by user category for IFSCA users and reporting entities)
  app.get(
    "/api/templates/with-rules",
    async (req: AuthenticatedRequest, res) => {
      try {
        const templates = await storage.getTemplates();

        // Filter templates based on user role and category
        let filteredTemplates = templates;

        if (req.user && req.user.category) {
          // IFSCA users and reporting entities can only see templates for their category
          if (
            req.user.role === "IFSCA_USER" ||
            req.user.role === "REPORTING_ENTITY"
          ) {
            // Convert user category to number for comparison
            const userCategoryId = parseInt(req.user.category);
            filteredTemplates = templates.filter(
              (template) => template.category === userCategoryId
            );
          }
        }
        // Super admins see all templates

        // Get templates that have validation files uploaded
        const templatesWithRules = filteredTemplates
          .filter((template) => template.validationFileUploaded)
          .map((template) => ({
            ...template,
            rulesCount: template.validationFileUploaded ? 1 : 0, // Show that rules exist via file upload
          }));

        res.json(templatesWithRules);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch templates" });
      }
    }
  );

  // Get template by ID
  app.get("/api/templates/:id", async (req: AuthenticatedRequest, res) => {
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
  app.post(
    "/api/templates/upload",
    upload.fields([
      { name: "template", maxCount: 1 },
      { name: "validationRules", maxCount: 1 },
    ]),
    async (req: MulterRequest, res) => {
      try {
        if (!req.files?.template?.[0]) {
          return res.status(400).json({ error: "No template file uploaded" });
        }

        const templateFile = req.files.template[0];
        const validationFile = req.files.validationRules?.[0];
        const { templateName, frequency, lastSubmissionDate, templateType, isXBRL } =
          req.body;

        console.log("Template upload request body:", {
          templateName,
          frequency,
          lastSubmissionDate,
          category: req.body.category,
        });

        // Validate template name
        if (!templateName || templateName.trim().length === 0) {
          return res.status(400).json({ error: "Template name is required" });
        }

        // Get uploader's category (for IFSCA users) or use body category
        let categoryId: number;

        console.log("Template upload - user info:", {
          userId: req.user?.id,
          role: req.user?.role,
          userCategory: req.user?.category,
          bodyCategory: req.body.category,
        });

        if (req.user && req.user.role === "IFSCA_USER" && req.user.category) {
          // For IFSCA users, use their category ID regardless of form input
          categoryId = parseInt(req.user.category);
          console.log(
            "Template upload - using IFSCA user category ID:",
            categoryId
          );
        } else if (req.body.category) {
          // Use the provided category ID
          categoryId = parseInt(req.body.category);
          console.log("Template upload - using form category ID:", categoryId);
        } else {
          // Default to banking category (ID 1)
          categoryId = 1;
          console.log(
            "Template upload - using default category ID:",
            categoryId
          );
        }

        // Create template record
        const templateData = {
          name: templateName.trim(),
          category: categoryId, // Store the category ID
          frequency: frequency || "monthly", // Default to monthly if not provided
          lastSubmissionDate: lastSubmissionDate
            ? new Date(lastSubmissionDate)
            : null,
          fileName: templateFile.originalname,
          filePath: templateFile.path,
          fileSize: templateFile.size,
          createdBy: req.user?.id || 1, // Use authenticated user ID or default to 1
          validationRulesPath: validationFile?.path,
          templateType: templateType || "excel", // Default to excel if not specified
          isXBRL: isXBRL === "true" || templateType === "xbrl", // Set XBRL flag
        };

        console.log("Creating template with data:", templateData);

        const template = await storage.createTemplate(templateData);

        // Parse and store validation rules if provided
        if (validationFile) {
          try {
            const parsed = await ModernValidationRulesParser.parseValidationFile(
              validationFile.path,
              template.id
            );
            const rules = parsed.rules;
            if (rules.length > 0) {
              await storage.createValidationRules(rules);
            }
          } catch (parseError) {
            console.error("Failed to parse validation rules:", parseError);
            // Continue without validation rules
          }
        }

        // Start processing in the background
        processTemplateAsync(template.id).catch((error) => {
          console.error(
            `Background processing failed for template ${template.id}:`,
            error
          );
        });

        res.json({
          message: "Template uploaded successfully",
          templateId: template.id,
          template,
          hasValidationRules: !!validationFile,
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload template" });
      }
    }
  );

  // Upload validation file for existing template
  app.post(
    "/api/templates/:id/validation-file",
    validationUpload.single("validationFile"),
    async (req: MulterRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);

        if (!req.file) {
          return res.status(400).json({ error: "No validation file uploaded" });
        }

        // Check if template exists
        const template = await storage.getTemplate(templateId);
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
        }

        const validationFile = req.file;
        const filePath = validationFile.path;

        try {
          // Update template with validation file path and mark as uploaded
          await storage.updateTemplateValidationRulesPath(templateId, filePath);
          await storage.updateValidationFileUploaded(templateId, true);

          // Parse and store validation rules
          const fileExtension = path
            .extname(validationFile.originalname)
            .toLowerCase();
          let rules: any[] = [];

          if (fileExtension === ".txt" || fileExtension === ".json" || fileExtension === ".yaml" || fileExtension === ".yml" || fileExtension === ".csv") {
            // Parse validation rules using modern parser
            const parsed = await ModernValidationRulesParser.parseValidationFile(
              filePath,
              templateId
            );
            rules = parsed.rules;
          } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
            // Parse Excel file rules using modern parser
            const parsed = await ModernValidationRulesParser.parseValidationFile(
              filePath,
              templateId
            );
            rules = parsed.rules;


          }

          // Save rules to database if any were parsed
          if (rules.length > 0) {
            await storage.createValidationRules(rules);
          }

          res.json({
            message: "Validation file uploaded successfully",
            templateId,
            filePath,
            rulesCreated: rules.length,
            validationFileUploaded: true,
          });
        } catch (parseError) {
          console.error("Failed to parse validation file:", parseError);

          // Still mark file as uploaded but with warning
          await storage.updateTemplateValidationRulesPath(templateId, filePath);
          await storage.updateValidationFileUploaded(templateId, true);

          res.json({
            message: "Validation file uploaded but parsing failed",
            templateId,
            filePath,
            rulesCreated: 0,
            validationFileUploaded: true,
            warning:
              "File uploaded but could not parse validation rules. Please check file format.",
          });
        }
      } catch (error) {
        console.error("Validation file upload error:", error);
        res.status(500).json({ error: "Failed to upload validation file" });
      }
    }
  );

  // Download validation file for a template
  app.get(
    "/api/templates/:id/validation-file/download",
    async (req: AuthenticatedRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);

        // Check if template exists
        const template = await storage.getTemplate(templateId);
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
        }

        // Check if validation file exists
        if (!template.validationRulesPath || !template.validationFileUploaded) {
          return res
            .status(404)
            .json({ error: "No validation file found for this template" });
        }

        // Check if file exists on disk
        if (!fs.existsSync(template.validationRulesPath)) {
          return res
            .status(404)
            .json({ error: "Validation file not found on disk" });
        }

        // Extract filename from path
        const filename = path.basename(template.validationRulesPath);

        // Set appropriate headers
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Type", "application/octet-stream");

        // Stream the file to response
        const fileStream = fs.createReadStream(template.validationRulesPath);
        fileStream.pipe(res);
      } catch (error) {
        console.error("Validation file download error:", error);
        res.status(500).json({ error: "Failed to download validation file" });
      }
    }
  );

  // Get processing status
  app.get(
    "/api/templates/:id/status",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const statuses = await storage.getProcessingStatus(id);
        res.json(statuses);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch processing status" });
      }
    }
  );

  // Get template sheets
  app.get(
    "/api/templates/:id/sheets",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const sheets = await storage.getTemplateSheets(id);
        res.json(sheets);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch template sheets" });
      }
    }
  );

  // Get template schemas
  app.get(
    "/api/templates/:id/schemas",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const schemas = await storage.getTemplateSchemas(id);
        res.json(schemas);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch template schemas" });
      }
    }
  );

  // Get specific schema
  app.get(
    "/api/templates/:id/schemas/:sheetId?",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const sheetId = req.params.sheetId
          ? parseInt(req.params.sheetId)
          : undefined;
        const schema = await storage.getTemplateSchema(id, sheetId);

        if (!schema) {
          return res.status(404).json({ error: "Schema not found" });
        }

        res.json(schema);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch schema" });
      }
    }
  );

  // Delete template
  app.delete("/api/templates/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Trigger processing for a template (for manual processing)
  app.post(
    "/api/templates/:id/process",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);

        // Check if template exists
        const template = await storage.getTemplate(id);
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
        }

        // Start processing in background
        processTemplateAsync(id).catch((error) => {
          console.error(
            `Background processing failed for template ${id}:`,
            error
          );
        });

        res.json({
          message: "Processing started",
          templateId: id,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to start processing" });
      }
    }
  );

  // Generate schemas for a template (manual trigger)
  app.post(
    "/api/templates/:id/generate-schemas",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);

        // Check if template exists
        const template = await storage.getTemplate(id);
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
        }

        // Start schema generation in background
        FileProcessor.generateSchemas(id).catch((error) => {
          console.error(`Schema generation failed for template ${id}:`, error);
        });

        res.json({ message: "Schema generation started" });
      } catch (error) {
        console.error("Generate schemas error:", error);
        res.status(500).json({ error: "Failed to start schema generation" });
      }
    }
  );

  // Get template types
  app.get("/api/template-types", (req: AuthenticatedRequest, res) => {
    const types = [
      {
        value: "monthly-clearing",
        label: "Monthly Report - Clearing Corporation",
      },
      {
        value: "quarterly-capital",
        label: "Quarterly Reporting Format for Capital Market Intermediaries",
      },
      { value: "liabilities", label: "Report on Liabilities" },
      {
        value: "stock-mar",
        label: "Stock Exchange - Market Activity Report (MAR)",
      },
      {
        value: "stock-mdr",
        label: "Stock Exchange - Market Data Report (MDR)",
      },
      { value: "treasury", label: "Treasury Report" },
    ];
    res.json(types);
  });

  // Get categories - accessible by all authenticated users
  app.get(
    "/api/categories",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const categories = await storage.getCategories();
        res.json(categories);
      } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    }
  );

  // System stats
  app.get("/api/stats", async (req: AuthenticatedRequest, res) => {
    try {
      const templates = await storage.getTemplates();
      const totalTemplates = templates.length;
      const processed = templates.filter(
        (t) => t.status === "completed"
      ).length;
      const processing = templates.filter(
        (t) => t.status === "processing"
      ).length;
      const failed = templates.filter((t) => t.status === "failed").length;

      res.json({
        totalTemplates,
        processed,
        processing,
        failed,
        averageConfidence: 94, // This could be calculated from actual schema data
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Download template file
  app.get(
    "/api/templates/:id/download",
    async (req: AuthenticatedRequest, res) => {
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
    }
  );

  // Get validation rules for a template (with optional sheet filtering)
  app.get(
    "/api/templates/:id/validation-rules",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const sheetId = req.query.sheetId
          ? parseInt(req.query.sheetId as string)
          : undefined;

        let rules = await storage.getValidationRules(id);

        // Filter by sheet if sheetId is provided
        if (sheetId !== undefined) {
          rules = rules.filter((rule) => rule.sheetId === sheetId);
        }

        res.json(rules);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch validation rules" });
      }
    }
  );

  // Create a new validation rule
  app.post(
    "/api/templates/:id/validation-rules",
    async (req: AuthenticatedRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const { sheetId, ruleType, field, condition, errorMessage, severity } =
          req.body;

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
          severity: severity || "error",
        });

        res.json(rule);
      } catch (error) {
        console.error("Create validation rule error:", error);
        res.status(500).json({ error: "Failed to create validation rule" });
      }
    }
  );

  // Update a validation rule
  app.put(
    "/api/templates/:id/validation-rules/:ruleId",
    async (req: AuthenticatedRequest, res) => {
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
        const ruleExists = existingRules.some((r) => r.id === ruleId);
        if (!ruleExists) {
          return res.status(404).json({ error: "Validation rule not found" });
        }

        // Delete old rule and create new one (since we don't have an update method)
        await storage.deleteValidationRules(templateId);

        // Re-create all rules except the one being updated
        const rulesToKeep = existingRules.filter((r) => r.id !== ruleId);
        const updatedRules = [
          ...rulesToKeep.map((r) => ({
            templateId: r.templateId,
            sheetId: r.sheetId,
            ruleType: r.ruleType,
            field: r.field,
            condition: r.condition,
            errorMessage: r.errorMessage,
            severity: r.severity,
          })),
          {
            templateId,
            sheetId: req.body.sheetId || null,
            ruleType,
            field,
            condition,
            errorMessage,
            severity: severity || "error",
          },
        ];

        await storage.createValidationRules(updatedRules);
        res.json({ message: "Validation rule updated successfully" });
      } catch (error) {
        console.error("Update validation rule error:", error);
        res.status(500).json({ error: "Failed to update validation rule" });
      }
    }
  );

  // Delete a validation rule
  app.delete(
    "/api/templates/:id/validation-rules/:ruleId",
    async (req: AuthenticatedRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const ruleId = parseInt(req.params.ruleId);

        // Get existing rules
        const existingRules = await storage.getValidationRules(templateId);
        const ruleExists = existingRules.some((r) => r.id === ruleId);

        if (!ruleExists) {
          return res.status(404).json({ error: "Validation rule not found" });
        }

        // Delete all rules and recreate without the deleted one
        await storage.deleteValidationRules(templateId);

        const rulesToKeep = existingRules
          .filter((r) => r.id !== ruleId)
          .map((r) => ({
            templateId: r.templateId,
            ruleType: r.ruleType,
            field: r.field,
            condition: r.condition,
            errorMessage: r.errorMessage,
            severity: r.severity,
          }));

        if (rulesToKeep.length > 0) {
          await storage.createValidationRules(rulesToKeep);
        }

        res.json({ message: "Validation rule deleted successfully" });
      } catch (error) {
        console.error("Delete validation rule error:", error);
        res.status(500).json({ error: "Failed to delete validation rule" });
      }
    }
  );

  // Bulk delete validation rules
  app.post(
    "/api/templates/:id/validation-rules/bulk-delete",
    async (req: AuthenticatedRequest, res) => {
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
          .filter((r) => !ruleIds.includes(r.id))
          .map((r) => ({
            templateId: r.templateId,
            ruleType: r.ruleType,
            field: r.field,
            condition: r.condition,
            errorMessage: r.errorMessage,
            severity: r.severity,
          }));

        if (rulesToKeep.length > 0) {
          await storage.createValidationRules(rulesToKeep);
        }

        res.json({ message: `${ruleIds.length} rules deleted successfully` });
      } catch (error) {
        console.error("Bulk delete validation rules error:", error);
        res.status(500).json({ error: "Failed to delete rules" });
      }
    }
  );

  // Import validation rules from text
  // Export validation rules to Excel
  app.post(
    "/api/export/validation-rules",
    async (req: AuthenticatedRequest, res) => {
      try {
        const { headers, rows } = req.body;

        if (!headers || !rows) {
          return res.status(400).json({ error: "Invalid export data" });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Validation Rules");

        // Add headers
        worksheet.addRow(headers);

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };

        // Add data rows
        rows.forEach((row: any[]) => worksheet.addRow(row));

        // Auto-fit columns
        worksheet.columns.forEach((column: any) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell: any) => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 2, 50);
        });

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=validation-rules.xlsx"
        );
        res.send(buffer);
      } catch (error: any) {
        console.error("Error exporting validation rules:", error);
        res.status(500).json({
          error: error.message || "Failed to export validation rules",
        });
      }
    }
  );

  // Import validation rules from Excel file
  app.post(
    "/api/templates/:id/validation-rules/import-excel",
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const file = req.file;

        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }

        // Check if it's an Excel file
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return res
            .status(400)
            .json({ error: "Please upload an Excel file (.xlsx or .xls)" });
        }

        // Parse Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(file.path);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
          return res
            .status(400)
            .json({ error: "No worksheet found in Excel file" });
        }

        // Get sheets for this template to map sheet names to IDs
        const sheets = await storage.getTemplateSheets(templateId);
        const sheetMap = new Map(
          sheets.map((s) => [s.sheetName.toLowerCase(), s.id])
        );

        // Parse rules from Excel
        const rules: any[] = [];
        let headerRow: string[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            // Header row
            headerRow = row.values as string[];
            headerRow = headerRow.slice(1); // Remove empty first element
          } else {
            // Data row
            const values = row.values as any[];
            const rowData = values.slice(1); // Remove empty first element

            if (rowData.length >= 6) {
              const sheetName =
                rowData[0]?.toString().toLowerCase() || "all sheets";
              const sheetId =
                sheetName === "all sheets"
                  ? null
                  : sheetMap.get(sheetName) || null;

              rules.push({
                templateId,
                sheetId,
                field: rowData[1]?.toString() || "",
                ruleType: rowData[2]?.toString().toLowerCase() || "required",
                condition: rowData[3]?.toString() || "",
                errorMessage: rowData[4]?.toString() || "",
                severity: rowData[5]?.toString().toLowerCase() || "error",
                createdAt: new Date(),
              });
            }
          }
        });

        if (rules.length === 0) {
          return res
            .status(400)
            .json({ error: "No valid rules found in Excel file" });
        }

        // Validate rule types and severity
        const validRuleTypes = ["required", "format", "range", "custom"];
        const validSeverities = ["error", "warning"];

        for (const rule of rules) {
          if (!validRuleTypes.includes(rule.ruleType)) {
            rule.ruleType = "required";
          }
          if (!validSeverities.includes(rule.severity)) {
            rule.severity = "error";
          }
        }

        // Insert rules
        const insertedRules = await storage.createValidationRules(rules);

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        res.json({
          imported: insertedRules.length,
          message: `Successfully imported ${insertedRules.length} validation rules`,
        });
      } catch (error: any) {
        console.error("Error importing validation rules from Excel:", error);
        res.status(500).json({
          error: error.message || "Failed to import validation rules",
        });
      }
    }
  );

  app.post(
    "/api/templates/:id/validation-rules/import",
    async (req: AuthenticatedRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const { rulesText } = req.body;

        if (!rulesText || typeof rulesText !== "string") {
          return res.status(400).json({ error: "Invalid rules text provided" });
        }

        // Parse the rules text
        // Create temporary file for parsing
        const tempFilePath = path.join('validation', `temp_${Date.now()}.txt`);
        fs.writeFileSync(tempFilePath, rulesText);
        
        const parsed = await ModernValidationRulesParser.parseValidationFile(tempFilePath, templateId);
        const parsedRules = parsed.rules;
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        if (parsedRules.length === 0) {
          return res
            .status(400)
            .json({ error: "No valid rules found in the provided text" });
        }

        // Create the rules
        const rules = parsedRules.map((rule) => ({
          templateId,
          ...rule,
        }));

        await storage.createValidationRules(rules);

        res.json({
          message: "Rules imported successfully",
          imported: rules.length,
        });
      } catch (error) {
        console.error("Import validation rules error:", error);
        res.status(500).json({ error: "Failed to import validation rules" });
      }
    }
  );

  // Get generation progress
  app.get(
    "/api/generation-progress/:sessionId",
    async (req: AuthenticatedRequest, res) => {
      const sessionId = req.params.sessionId;
      const progress = generationProgress.get(sessionId);

      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }

      res.json(progress);

      // Clean up completed or errored progress after 5 minutes
      if (progress.status === "completed" || progress.status === "error") {
        setTimeout(() => {
          generationProgress.delete(sessionId);
        }, 5 * 60 * 1000);
      }
    }
  );

  // Generate validation rules for a specific sheet using AI
  app.post(
    "/api/templates/:templateId/sheets/:sheetId/generate-rules",
    async (req: AuthenticatedRequest, res) => {
      try {
        const templateId = parseInt(req.params.templateId);
        const sheetId = parseInt(req.params.sheetId);
        const { sheetData, sheetName, sheetIndex } = req.body;

        if (!sheetData || !sheetName) {
          return res
            .status(400)
            .json({ error: "Sheet data and name are required" });
        }

        const CHUNK_SIZE = 50; // Process 50 rows at a time
        const MAX_CHUNKS = 5; // Process up to 5 chunks (250 rows total)
        const totalRows = sheetData.data.length;
        const chunksToProcess = Math.min(
          Math.ceil(totalRows / CHUNK_SIZE),
          MAX_CHUNKS
        );

        // Generate unique session ID for progress tracking
        const sessionId = `${templateId}-${sheetId}-${Date.now()}`;

        // Initialize progress tracking
        generationProgress.set(sessionId, {
          templateId,
          sheetId,
          currentChunk: 0,
          totalChunks: chunksToProcess,
          status: "processing",
          message: `Starting to process ${chunksToProcess} chunks for sheet ${sheetName}`,
        });

        // Send sessionId to frontend immediately
        res.json({
          sessionId,
          totalChunks: chunksToProcess,
          message: "Rule generation started",
        });

        // Continue processing in background
        (async () => {
          try {
            console.log(
              `Processing ${chunksToProcess} chunks for sheet ${sheetName} with ${totalRows} rows`
            );

            const genai = await import("@google/genai");
            const genAI = new genai.GoogleGenAI({
              apiKey: process.env.GEMINI_API_KEY!,
            });

            // Map to store unique rules by field and ruleType
            const uniqueRulesMap = new Map<string, any>();

            // Process data in chunks
            for (let i = 0; i < chunksToProcess; i++) {
              const startIdx = i * CHUNK_SIZE;
              const endIdx = Math.min(startIdx + CHUNK_SIZE, totalRows);
              const chunkData = sheetData.data.slice(startIdx, endIdx);

              // Update progress
              generationProgress.set(sessionId, {
                templateId,
                sheetId,
                currentChunk: i + 1,
                totalChunks: chunksToProcess,
                status: "processing",
                message: `Processing chunk ${
                  i + 1
                } of ${chunksToProcess} (rows ${startIdx + 1} to ${endIdx})`,
              });

              // Skip if chunk is empty
              if (chunkData.length === 0) continue;

              const analysisPrompt = `
Analyze this Excel sheet data chunk and generate validation rules.

Sheet Name: ${sheetName}
Data Chunk ${i + 1} of ${chunksToProcess} (rows ${startIdx + 1} to ${endIdx}):
${JSON.stringify(chunkData, null, 2)}

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

              try {
                const result = await genAI.models.generateContent({
                  model: "gemini-1.5-flash",
                  contents: analysisPrompt,
                });

                const text = result.text || "";

                if (!text) {
                  console.warn(`No response from AI model for chunk ${i + 1}`);
                  continue;
                }

                // Extract JSON from the response
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                  console.warn(
                    `Failed to parse AI response for chunk ${i + 1}`
                  );
                  continue;
                }

                const chunkRules = JSON.parse(jsonMatch[0]);

                // Add rules to map, deduplicating by field + ruleType
                for (const rule of chunkRules) {
                  const key = `${rule.field}_${rule.ruleType}`;

                  // For range rules, merge min/max values
                  if (rule.ruleType === "range" && uniqueRulesMap.has(key)) {
                    const existingRule = uniqueRulesMap.get(key);
                    const existingCondition = existingRule.condition;
                    const newCondition = rule.condition;

                    // Parse and merge range conditions
                    const existingMatch = existingCondition.match(
                      /min:(-?\d+(?:\.\d+)?),max:(-?\d+(?:\.\d+)?)/
                    );
                    const newMatch = newCondition.match(
                      /min:(-?\d+(?:\.\d+)?),max:(-?\d+(?:\.\d+)?)/
                    );

                    if (existingMatch && newMatch) {
                      const minVal = Math.min(
                        parseFloat(existingMatch[1]),
                        parseFloat(newMatch[1])
                      );
                      const maxVal = Math.max(
                        parseFloat(existingMatch[2]),
                        parseFloat(newMatch[2])
                      );
                      existingRule.condition = `min:${minVal},max:${maxVal}`;
                    }
                  } else {
                    uniqueRulesMap.set(key, rule);
                  }
                }
              } catch (chunkError) {
                console.error(`Error processing chunk ${i + 1}:`, chunkError);
                // Continue with next chunk
              }
            }

            // Convert map to array
            const generatedRules = Array.from(uniqueRulesMap.values());

            if (generatedRules.length === 0) {
              generationProgress.set(sessionId, {
                templateId,
                sheetId,
                currentChunk: chunksToProcess,
                totalChunks: chunksToProcess,
                status: "error",
                message: "No validation rules could be generated from the data",
              });
              return;
            }

            // Save the generated rules to database
            const rulesToCreate = generatedRules.map((rule: any) => ({
              templateId,
              sheetId,
              ruleType: rule.ruleType,
              field: rule.field,
              condition: rule.condition,
              errorMessage: rule.errorMessage,
              severity: rule.severity || "error",
            }));

            await storage.createValidationRules(rulesToCreate);

            // Update progress to completed
            generationProgress.set(sessionId, {
              templateId,
              sheetId,
              currentChunk: chunksToProcess,
              totalChunks: chunksToProcess,
              status: "completed",
              message: `Successfully generated ${rulesToCreate.length} validation rules`,
            });
          } catch (error) {
            console.error("Generate validation rules error:", error);
            generationProgress.set(sessionId, {
              templateId,
              sheetId,
              currentChunk: 0,
              totalChunks: chunksToProcess,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to generate validation rules",
            });
          }
        })();
      } catch (error) {
        console.error("Generate validation rules error:", error);
        res.status(500).json({ error: "Failed to generate validation rules" });
      }
    }
  );

  // Submit a filled template for validation
  app.post(
    "/api/submissions/upload",
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { templateId, reportingPeriod } = req.body;
        const userId = req.user?.id || 1; // Get from authenticated user
        const userCategory = req.user?.category || 1; // Get user's category ID

        if (!templateId) {
          return res.status(400).json({ error: "Template ID is required" });
        }

        if (!reportingPeriod) {
          return res
            .status(400)
            .json({ error: "Reporting period is required" });
        }

        // Create submission record
        const submission = await storage.createSubmission({
          templateId: parseInt(templateId),
          userId,
          category:
            typeof userCategory === "string"
              ? parseInt(userCategory)
              : userCategory, // Include user's category
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          reportingPeriod,
        });

        // Validate submission in background
        validateSubmissionAsync(submission.id);

        res.json({
          message: "Submission uploaded successfully",
          submissionId: submission.id,
          submission,
        });
      } catch (error) {
        // Enhanced error logging and return real error message for debugging
        console.error("Submission error:", error);
        let errorMsg = "Failed to upload submission";
        if (error instanceof Error) {
          errorMsg += ": " + error.message;
        } else if (typeof error === "string") {
          errorMsg += ": " + error;
        }
        res.status(500).json({ error: errorMsg });
      }
    }
  );

  // Get user submissions (filtered by category for non-super admins)
  app.get("/api/submissions", async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, templateId } = req.query;
      console.log("Fetching submissions with params:", {
        userId,
        templateId,
        userRole: req.user?.role,
        userCategory: req.user?.category,
      });

      let submissions;
      
      // For IFSCA users, show all submissions in their category (don't filter by userId)
      if (req.user?.role === "IFSCA_USER") {
        submissions = await storage.getSubmissions(
          undefined, // Don't filter by userId for IFSCA users
          templateId ? parseInt(templateId as string) : undefined,
          req.user.category // Filter by category
        );
        console.log("IFSCA user - Retrieved submissions by category:", submissions.length);
      } else {
        // For other users (reporting entities), filter by userId and then by category
        submissions = await storage.getSubmissions(
          userId ? parseInt(userId as string) : undefined,
          templateId ? parseInt(templateId as string) : undefined
        );

        console.log("Retrieved submissions:", submissions.length);

        // Filter submissions by category for reporting entities
        if (req.user && req.user.category && req.user.role === "REPORTING_ENTITY") {
          submissions = submissions.filter(
            (submission: any) => submission.category === req.user!.category
          );
          console.log("Filtered submissions by category:", submissions.length);
        }
      }

      res.json(submissions);
    } catch (error) {
      console.error("Submissions API error:", error);
      res.status(500).json({
        error: "Failed to fetch submissions",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get all submissions for admin view
  app.get("/api/admin/submissions", async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.query;
      let submissions = await storage.getSubmissions();

      // Filter by category if provided in query params
      if (category) {
        submissions = submissions.filter(
          (submission: any) => submission.category == category
        );
      }

      // Add user information to each submission
      const submissionsWithUsers = [];
      for (const submission of submissions) {
        const user = await storage.getUser(submission.userId);
        submissionsWithUsers.push({
          ...submission,
          userName: user?.username || `User ${submission.userId}`,
        });
      }

      res.json(submissionsWithUsers);
    } catch (error) {
      console.error("Error fetching admin submissions:", error);
      res.status(500).json({ error: JSON.stringify(error) });
    }
  });

  // Get submission details
  app.get("/api/submissions/:id", async (req: AuthenticatedRequest, res) => {
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

  // Approve submission (Admin only)
  app.post(
    "/api/submissions/:id/approve",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const submission = await storage.getSubmission(id);

        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Update submission status
        await storage.updateSubmissionStatus(id, "approved", req.user?.id);

        // Create an audit comment
        await storage.createComment({
          submissionId: id,
          userId: req.user!.id,
          text: "Submission approved",
        });

        res.json({ message: "Submission approved successfully" });
      } catch (error) {
        console.error("Approve submission error:", error);
        res.status(500).json({ error: "Failed to approve submission" });
      }
    }
  );

  // Reject submission (Admin only)
  app.post(
    "/api/submissions/:id/reject",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const { reason } = req.body;

        if (
          !reason ||
          typeof reason !== "string" ||
          reason.trim().length === 0
        ) {
          return res
            .status(400)
            .json({ error: "Rejection reason is required" });
        }

        const submission = await storage.getSubmission(id);
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Update submission status
        await storage.updateSubmissionStatus(id, "rejected", req.user?.id);

        // Create an audit comment with rejection reason
        await storage.createComment({
          submissionId: id,
          userId: req.user!.id,
          text: `Submission rejected - Reason: ${reason.trim()}`,
        });

        res.json({ message: "Submission rejected successfully" });
      } catch (error) {
        console.error("Reject submission error:", error);
        res.status(500).json({ error: "Failed to reject submission" });
      }
    }
  );

  // Return submission for revision (Admin only)
  app.post(
    "/api/submissions/:id/return",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const { feedback } = req.body;

        if (
          !feedback ||
          typeof feedback !== "string" ||
          feedback.trim().length === 0
        ) {
          return res
            .status(400)
            .json({ error: "Feedback is required for returned submissions" });
        }

        const submission = await storage.getSubmission(id);
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Update submission status
        await storage.updateSubmissionStatus(id, "returned", req.user?.id);

        // Create an audit comment with feedback
        await storage.createComment({
          submissionId: id,
          userId: req.user!.id,
          text: `Submission returned for revision - Feedback: ${feedback.trim()}`,
        });

        res.json({ message: "Submission returned successfully" });
      } catch (error) {
        console.error("Return submission error:", error);
        res.status(500).json({ error: "Failed to return submission" });
      }
    }
  );

  // Re-upload file for returned submission
  app.post(
    "/api/submissions/:id/reupload",
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        const submissionId = parseInt(req.params.id);
        const file = req.file;

        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // Verify the submission exists and is in "returned" status
        const submission = await storage.getSubmission(submissionId);
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        if (submission.status !== "returned") {
          return res.status(400).json({
            error:
              "Can only re-upload files for submissions that have been returned",
          });
        }

        // Verify file type
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          fs.unlinkSync(file.path);
          return res
            .status(400)
            .json({ error: "Only Excel and CSV files are allowed" });
        }

        // Get template to check if it has validation rules
        const template = await storage.getTemplate(submission.templateId);
        if (!template) {
          fs.unlinkSync(file.path);
          return res.status(404).json({ error: "Template not found" });
        }

        // Create new submission record for the re-uploaded file
        const newSubmission = await storage.createSubmission({
          userId: submission.userId,
          templateId: submission.templateId,
          category: submission.category, // Keep the same category from original submission
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          reportingPeriod: submission.reportingPeriod,
          status: "pending",
        });

        // Add comment indicating this is a re-upload
        await storage.createComment({
          submissionId: newSubmission.id,
          userId: submission.userId,
          text: `File re-uploaded to address issues from submission #${submissionId}`,
          systemGenerated: true,
        });

        // Start validation if template has rules
        if (template.validationFileUploaded) {
          // Update submission status to validating
          await storage.updateSubmissionStatus(newSubmission.id, "pending");

          // Start async validation
          validateSubmissionAsync(newSubmission.id);
        }

        res.json({
          message: "File re-uploaded successfully",
          submissionId: newSubmission.id,
          hasValidationRules: template.validationFileUploaded,
        });
      } catch (error) {
        console.error("Re-upload error:", error);
        res.status(500).json({ error: "Failed to re-upload file" });
      }
    }
  );

  // Get validation results for a submission
  app.get(
    "/api/submissions/:id/results",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const results = await storage.getValidationResults(id);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch validation results" });
      }
    }
  );

  // Download submission file
  app.get(
    "/api/submissions/:id/download",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const submission = await storage.getSubmission(id);

        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Check if file exists
        if (!fs.existsSync(submission.filePath)) {
          return res.status(404).json({ error: "File not found" });
        }

        // Set headers for file download
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${submission.fileName}"`
        );

        // Stream the file
        const fileStream = fs.createReadStream(submission.filePath);
        fileStream.pipe(res);
      } catch (error) {
        res.status(500).json({ error: "Failed to download file" });
      }
    }
  );

  // Delete submission
  app.delete("/api/submissions/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getSubmission(id);

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // Delete the file from disk if it exists
      if (fs.existsSync(submission.filePath)) {
        fs.unlinkSync(submission.filePath);
      }

      // Delete validation results first (foreign key constraint)
      await storage.deleteValidationResults(id);

      // Delete submission record
      await storage.deleteSubmission(id);

      res.json({ message: "Submission deleted successfully" });
    } catch (error) {
      console.error("Delete submission error:", error);
      res.status(500).json({ error: "Failed to delete submission" });
    }
  });

  // Generate example validation rules file
  app.get("/api/validation-rules/example", (req: AuthenticatedRequest, res) => {
    const example = `{
  "metadata": {
    "templateName": "Sample Template",
    "version": "1.0",
    "createdBy": "IFSCA Team",
    "description": "Example validation rules"
  },
  "sheetValidations": {
    "Sheet1": {
      "columnValidations": {
        "A": {
          "dataType": "string",
          "required": true,
          "minLength": 1,
          "maxLength": 100
        },
        "B": {
          "dataType": "number",
          "required": true,
          "minimum": 0,
          "maximum": 999999
        }
      }
    }
  }
}`;
    res.type("text/plain").send(example);
  });

  // Generate validation rules template for specific template
  app.get("/api/templates/:id/validation-template", async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const format = req.query.format || 'json';
      
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const sheets = await storage.getTemplateSheets(templateId);
      const schemas = await storage.getTemplateSchemas(templateId);
      
      if (format === 'json') {
        const jsonTemplate = {
          metadata: {
            templateName: template.name,
            version: "1.0",
            createdBy: "IFSCA Team",
            createdDate: new Date().toISOString().split('T')[0],
            description: `Validation rules for ${template.name}`
          },
          sheetValidations: {}
        };

        // Add each sheet with its columns
        for (const sheet of sheets) {
          const sheetSchemas = schemas.filter(s => s.sheetId === sheet.id);
          jsonTemplate.sheetValidations[sheet.sheetName] = {
            columnValidations: {}
          };

          // Add column validations for each field
          for (const schema of sheetSchemas) {
            let columnLetter = 'A';
            if (schema.columnName) {
              columnLetter = schema.columnName;
            } else if (schema.fieldName && typeof schema.fieldName === 'string' && schema.fieldName.length > 0) {
              columnLetter = schema.fieldName.charAt(0);
            }
            
            jsonTemplate.sheetValidations[sheet.sheetName].columnValidations[columnLetter] = {
              dataType: "string", // Default, user can change
              required: true,
              description: schema.fieldName || 'Field'
            };
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${template.name}-validation-rules.json"`);
        res.send(JSON.stringify(jsonTemplate, null, 2));
      } 
      else if (format === 'yaml') {
        let yamlContent = `metadata:
  templateName: "${template.name}"
  version: "1.0"
  createdBy: "IFSCA Team"
  createdDate: "${new Date().toISOString().split('T')[0]}"
  description: "Validation rules for ${template.name}"

sheetValidations:
`;

        for (const sheet of sheets) {
          const sheetSchemas = schemas.filter(s => s.sheetId === sheet.id);
          yamlContent += `  "${sheet.sheetName}":
    columnValidations:
`;
          
          for (const schema of sheetSchemas) {
            let columnLetter = 'A';
            if (schema.columnName) {
              columnLetter = schema.columnName;
            } else if (schema.fieldName && typeof schema.fieldName === 'string' && schema.fieldName.length > 0) {
              columnLetter = schema.fieldName.charAt(0);
            }
            
            yamlContent += `      ${columnLetter}:
        dataType: string
        required: true
        description: "${schema.fieldName || 'Field'}"
      
`;
          }
        }

        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', `attachment; filename="${template.name}-validation-rules.yaml"`);
        res.send(yamlContent);
      }
      else if (format === 'csv') {
        let csvContent = 'RuleType,SheetName,Column,Row,Field,Required,DataType,MinLength,MaxLength,Minimum,Maximum,Pattern,EnumValues,Expression,Description,Severity,RowRange,ColumnRange,CellRange,ApplyToAllRows\n';
        
        // Add header validation examples first
        for (const sheet of sheets) {
          const sheetSchemas = schemas.filter(s => s.sheetId === sheet.id);
          for (let i = 0; i < sheetSchemas.length; i++) {
            const schema = sheetSchemas[i];
            let columnLetter = String.fromCharCode(65 + i); // A, B, C, etc.
            if (schema.columnName) {
              columnLetter = schema.columnName;
            }
            
            // Header cell validation
            csvContent += `cell,${sheet.sheetName},${columnLetter},1,Header_${schema.fieldName || 'Field'},true,string,,,,,,,,"Cell ${columnLetter}1 must contain '${schema.fieldName || 'Field'}' header",error,1,${columnLetter},${columnLetter}1,false\n`;
          }
        }
        
        // Add data validation examples
        for (const sheet of sheets) {
          const sheetSchemas = schemas.filter(s => s.sheetId === sheet.id);
          for (let i = 0; i < sheetSchemas.length; i++) {
            const schema = sheetSchemas[i];
            let columnLetter = String.fromCharCode(65 + i); // A, B, C, etc.
            if (schema.columnName) {
              columnLetter = schema.columnName;
            }
            
            // Column data validation
            csvContent += `column,${sheet.sheetName},${columnLetter},,${schema.fieldName || 'Field'},true,string,,,,,,,,"Column ${columnLetter} validation for ${schema.fieldName || 'Field'}",error,2-*,${columnLetter},${columnLetter}2:${columnLetter}1000,true\n`;
            
            // First data cell validation
            csvContent += `cell,${sheet.sheetName},${columnLetter},2,First_${schema.fieldName || 'Field'},true,string,,,,,,,,"Cell ${columnLetter}2 must contain first ${schema.fieldName || 'Field'}",error,2,${columnLetter},${columnLetter}2,false\n`;
          }
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${template.name}-validation-rules.csv"`);
        res.send(csvContent);
      }
      else if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Validation Rules');

        // Add headers including Row and cell-based validation fields
        worksheet.columns = [
          { header: 'RuleType', key: 'ruleType', width: 15 },
          { header: 'SheetName', key: 'sheetName', width: 20 },
          { header: 'Column', key: 'column', width: 10 },
          { header: 'Row', key: 'row', width: 8 },
          { header: 'Field', key: 'field', width: 20 },
          { header: 'Required', key: 'required', width: 10 },
          { header: 'DataType', key: 'dataType', width: 15 },
          { header: 'MinLength', key: 'minLength', width: 12 },
          { header: 'MaxLength', key: 'maxLength', width: 12 },
          { header: 'Minimum', key: 'minimum', width: 10 },
          { header: 'Maximum', key: 'maximum', width: 10 },
          { header: 'Pattern', key: 'pattern', width: 20 },
          { header: 'EnumValues', key: 'enumValues', width: 20 },
          { header: 'Expression', key: 'expression', width: 30 },
          { header: 'Description', key: 'description', width: 40 },
          { header: 'Severity', key: 'severity', width: 10 },
          { header: 'RowRange', key: 'rowRange', width: 12 },
          { header: 'ColumnRange', key: 'columnRange', width: 15 },
          { header: 'CellRange', key: 'cellRange', width: 15 },
          { header: 'ApplyToAllRows', key: 'applyToAllRows', width: 15 }
        ];

        // Add data rows with cell-based validation examples
        for (const sheet of sheets) {
          const sheetSchemas = schemas.filter(s => s.sheetId === sheet.id);
          
          // Add header validation rows
          for (let i = 0; i < sheetSchemas.length; i++) {
            const schema = sheetSchemas[i];
            let columnLetter = String.fromCharCode(65 + i); // A, B, C, etc.
            if (schema.columnName) {
              columnLetter = schema.columnName;
            }
            
            worksheet.addRow({
              ruleType: 'cell',
              sheetName: sheet.sheetName,
              column: columnLetter,
              row: '1',
              field: `Header_${schema.fieldName || 'Field'}`,
              required: 'true',
              dataType: 'string',
              minLength: '',
              maxLength: '',
              minimum: '',
              maximum: '',
              pattern: '',
              enumValues: '',
              expression: '',
              description: `Cell ${columnLetter}1 must contain '${schema.fieldName || 'Field'}' header`,
              severity: 'error',
              rowRange: '1',
              columnRange: columnLetter,
              cellRange: `${columnLetter}1`,
              applyToAllRows: 'false'
            });
          }
          
          // Add column validation rows
          for (let i = 0; i < sheetSchemas.length; i++) {
            const schema = sheetSchemas[i];
            let columnLetter = String.fromCharCode(65 + i); // A, B, C, etc.
            if (schema.columnName) {
              columnLetter = schema.columnName;
            }
            
            worksheet.addRow({
              ruleType: 'column',
              sheetName: sheet.sheetName,
              column: columnLetter,
              row: '',
              field: schema.fieldName || 'Field',
              required: 'true',
              dataType: 'string',
              minLength: '',
              maxLength: '',
              minimum: '',
              maximum: '',
              pattern: '',
              enumValues: '',
              expression: '',
              description: `Column ${columnLetter} validation for ${schema.fieldName || 'Field'}`,
              severity: 'error',
              rowRange: '2-*',
              columnRange: columnLetter,
              cellRange: `${columnLetter}2:${columnLetter}1000`,
              applyToAllRows: 'true'
            });
            
            // Add first data cell validation
            worksheet.addRow({
              ruleType: 'cell',
              sheetName: sheet.sheetName,
              column: columnLetter,
              row: '2',
              field: `First_${schema.fieldName || 'Field'}`,
              required: 'true',
              dataType: 'string',
              minLength: '',
              maxLength: '',
              minimum: '',
              maximum: '',
              pattern: '',
              enumValues: '',
              expression: '',
              description: `Cell ${columnLetter}2 must contain first ${schema.fieldName || 'Field'}`,
              severity: 'error',
              rowRange: '2',
              columnRange: columnLetter,
              cellRange: `${columnLetter}2`,
              applyToAllRows: 'false'
            });
          }
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${template.name}-validation-rules.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
      }
      else if (format === 'txt') {
        let txtContent = `# Validation Rules for ${template.name}
# Generated on ${new Date().toISOString().split('T')[0]}
# 
# Format: RULE_TYPE:SHEET_NAME:FIELD:CONDITION:ERROR_MESSAGE:SEVERITY
# 
# Available rule types:
# - required: Field must have a value
# - format: Field must match a specific format
# - range: Field must be within a numeric range
# - custom: Custom validation expression
#
# Examples:
# required:Sheet1:A:*:Field A is required:error
# format:Sheet1:B:email:Invalid email format:error
# range:Sheet1:C:1-100:Value must be between 1 and 100:warning
#

`;

        for (const sheet of sheets) {
          const sheetSchemas = schemas.filter(s => s.sheetId === sheet.id);
          txtContent += `\n# ${sheet.sheetName} validation rules\n`;
          
          for (const schema of sheetSchemas) {
            let columnLetter = 'A';
            if (schema.columnName) {
              columnLetter = schema.columnName;
            } else if (schema.fieldName && typeof schema.fieldName === 'string' && schema.fieldName.length > 0) {
              columnLetter = schema.fieldName.charAt(0);
            }
            
            txtContent += `required:${sheet.sheetName}:${columnLetter}:*:${schema.fieldName || 'Field'} is required:error\n`;
          }
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${template.name}-validation-rules.txt"`);
        res.send(txtContent);
      }
      else {
        res.status(400).json({ error: "Unsupported format. Use json, yaml, csv, excel, or txt." });
      }
    } catch (error) {
      console.error("Error generating validation template:", error);
      res.status(500).json({ error: "Failed to generate validation template" });
    }
  });

  // Get Excel data for viewer
  app.get(
    "/api/templates/:id/excel-data",
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        console.log(`Fetching Excel data for template ID: ${id}`);

        const template = await storage.getTemplate(id);

        if (!template) {
          console.log(`Template ${id} not found`);
          return res.status(404).json({ error: "Template not found" });
        }

        console.log(
          `Template found: ${template.name}, file path: ${template.filePath}`
        );

        // Get the sheets for this template
        const sheets = await storage.getTemplateSheets(id);
        console.log(`Found ${sheets.length} sheets for template ${id}`);

        if (sheets.length === 0) {
          console.log(
            `No sheets found for template ${id}, returning empty array`
          );
          return res.json([]);
        }

        // Check if file exists
        const fs = await import("fs");
        if (!fs.existsSync(template.filePath)) {
          console.error(
            `Template file not found at path: ${template.filePath}`
          );
          return res.status(404).json({ error: "Template file not found" });
        }

        // Parse the Excel file to get data
        const workbook = new ExcelJS.Workbook();
        const ext = path.extname(template.filePath).toLowerCase();
        console.log(`File extension: ${ext}`);

        if (ext === ".xlsx" || ext === ".xls") {
          await workbook.xlsx.readFile(template.filePath);
        } else if (ext === ".csv") {
          await workbook.csv.readFile(template.filePath);
        } else {
          console.error(`Unsupported file type: ${ext}`);
          return res.status(400).json({ error: "Unsupported file type" });
        }

        console.log(
          `Workbook loaded, worksheets: ${workbook.worksheets.length}`
        );

        // Get all worksheets data with proper formatting for ExcelViewer
        const sheetData = [];
        for (const sheet of sheets) {
          console.log(`Processing sheet: ${sheet.sheetName}`);
          const worksheet = workbook.getWorksheet(sheet.sheetName);
          if (worksheet) {
            console.log(
              `Worksheet found, rows: ${worksheet.rowCount}, cols: ${worksheet.columnCount}`
            );
            const cellData: (any | null)[][] = [];
            const mergedCells: Array<{
              top: number;
              left: number;
              bottom: number;
              right: number;
            }> = [];

            // Get merged cell ranges
            const mergedRanges = worksheet.model.merges || [];
            mergedRanges.forEach((range: any) => {
              mergedCells.push({
                top: range.top - 1, // Convert to 0-based indexing
                left: range.left - 1,
                bottom: range.bottom - 1,
                right: range.right - 1,
              });
            });

            // Process rows (limit to first 100 for preview)
            for (
              let rowNum = 1;
              rowNum <= Math.min(100, worksheet.rowCount);
              rowNum++
            ) {
              const row = worksheet.getRow(rowNum);
              const rowData: (any | null)[] = [];

              for (let colNum = 1; colNum <= worksheet.columnCount; colNum++) {
                const cell = row.getCell(colNum);
                let cellObj: any = null;

                if (cell.value !== null && cell.value !== undefined) {
                  // Check if this cell is part of a merged range
                  const rowIndex = rowNum - 1; // 0-based
                  const colIndex = colNum - 1; // 0-based

                  let mergeInfo = null;
                  let isMerged = false;

                  for (const merge of mergedCells) {
                    if (
                      rowIndex >= merge.top &&
                      rowIndex <= merge.bottom &&
                      colIndex >= merge.left &&
                      colIndex <= merge.right
                    ) {
                      isMerged = true;
                      mergeInfo = {
                        top: merge.top,
                        left: merge.left,
                        bottom: merge.bottom,
                        right: merge.right,
                        isTopLeft:
                          rowIndex === merge.top && colIndex === merge.left,
                      };
                      break;
                    }
                  }

                  cellObj = {
                    // Only set value for top-left cell of merged range, or non-merged cells
                    value:
                      isMerged && mergeInfo && !mergeInfo.isTopLeft
                        ? null
                        : cell.value,
                    merged: isMerged,
                    mergeInfo: mergeInfo,
                    style: {
                      backgroundColor:
                        cell.style?.fill &&
                        "fgColor" in cell.style.fill &&
                        cell.style.fill.fgColor?.argb
                          ? `#${cell.style.fill.fgColor.argb.slice(2)}`
                          : null,
                      color: cell.style?.font?.color?.argb
                        ? `#${cell.style.font.color.argb.slice(2)}`
                        : null,
                      fontWeight: cell.style?.font?.bold ? "bold" : "normal",
                      textAlign: cell.style?.alignment?.horizontal || "left",
                      verticalAlign:
                        cell.style?.alignment?.vertical || "middle",
                    },
                  };
                }

                rowData.push(cellObj);
              }

              cellData.push(rowData);
            }

            const processedSheet = {
              sheetName: sheet.sheetName,
              data: cellData,
              mergedCells: mergedCells,
            };

            console.log(
              `Processed sheet ${sheet.sheetName}: ${cellData.length} rows`
            );
            sheetData.push(processedSheet);
          } else {
            console.warn(`Worksheet not found: ${sheet.sheetName}`);
          }
        }

        console.log(`Returning ${sheetData.length} sheets of data`);
        res.json(sheetData);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        res.status(500).json({ error: "Failed to read template file" });
      }
    }
  );

  // Get comments for a submission
  app.get(
    "/api/submissions/:id/comments",
    async (req: AuthenticatedRequest, res) => {
      // Check authentication first
      // if (!req.user) {
      //   return res.status(401).json({ error: "Authentication required" });
      // }

      try {
        const submissionId = parseInt(req.params.id);

        // Get the submission to verify it exists and check permissions
        const submission = await storage.getSubmission(submissionId);
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Get comments with user information
        const comments = await storage.getCommentsWithUsers(submissionId);
        res.json(comments);
      } catch (error) {
        console.error("Error fetching submission comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
      }
    }
  );

  // Add comment to a submission
  app.post(
    "/api/submissions/:id/comments",
    async (req: AuthenticatedRequest, res) => {
      // Check authentication first
      const { content, parentCommentId, user } = req.body;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      try {
        const submissionId = parseInt(req.params.id);

        if (
          !content ||
          typeof content !== "string" ||
          content.trim().length === 0
        ) {
          return res.status(400).json({ error: "Comment content is required" });
        }

        // Get the submission to verify it exists and check permissions
        const submission = await storage.getSubmission(submissionId);
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Create comment
        const comment = await storage.createComment({
          submissionId,
          userId: user.id,
          parentCommentId: parentCommentId || null,
          text: content.trim(),
        });

        // Get the comment with user information
        const commentWithUser = {
          ...comment,
          username: user.username,
        };

        res.json(commentWithUser);
      } catch (error) {
        console.error("Error creating submission comment:", error);
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  );

  // IFSCA IFSCA Regulator Management Endpoints

  // Test endpoint to verify API routing is working
  app.get("/api/test", (req: AuthenticatedRequest, res) => {
    console.log("TEST endpoint hit!");
    res.json({
      message: "API routing is working",
      timestamp: new Date().toISOString(),
    });
  });

  // Analytics endpoint for admin users
  app.get(
    "/api/admin/analytics",
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const category = req.query.category;
        const userRole = req.user?.role;
        const userCategory = req.user?.category;

        // For IFSCA users, filter by their category
        // For super admins, show all or filter by requested category
        let categoryFilter: number | undefined = undefined;
        if (userRole === "IFSCA_USER") {
          categoryFilter = userCategory
            ? typeof userCategory === "string"
              ? parseInt(userCategory)
              : userCategory
            : undefined;
        } else if (category && userRole === "IFSCA") {
          categoryFilter = parseInt(category as string);
        }

        // Get all submissions with category filtering
        const submissions = await storage.getSubmissions(
          undefined,
          undefined,
          categoryFilter
        );

        // Get all users for the category
        const allUsers = await storage.getAllUsers();
        const users = categoryFilter
          ? allUsers.filter((u) => u.category === categoryFilter)
          : allUsers;

        // Get templates for the category
        const allTemplates = await storage.getTemplates();
        const templates = categoryFilter
          ? allTemplates.filter((t) => t.category === categoryFilter)
          : allTemplates;

        // Calculate analytics
        const totalSubmissions = submissions.length;

        // Status breakdown
        const submissionsByStatus = submissions.reduce(
          (acc: any, sub: any) => {
            acc[sub.status] = (acc[sub.status] || 0) + 1;
            return acc;
          },
          { passed: 0, failed: 0, pending: 0, rejected: 0, returned: 0 }
        );

        // User engagement
        const activeUserIds = new Set(submissions.map((s) => s.userId));
        const userEngagement = {
          totalUsers: users.length,
          activeUsers: activeUserIds.size,
          submissionsPerUser:
            users.length > 0 ? submissions.length / users.length : 0,
        };

        // Template analytics
        const templateAnalytics = templates.map((template) => {
          const templateSubmissions = submissions.filter(
            (s) => s.templateId === template.id
          );
          const successfulSubmissions = templateSubmissions.filter(
            (s) => s.status === "passed"
          );

          return {
            templateName: template.name,
            submissionCount: templateSubmissions.length,
            successRate:
              templateSubmissions.length > 0
                ? (successfulSubmissions.length / templateSubmissions.length) *
                  100
                : 0,
            avgProcessingTime: 2.5, // Mock data - would need processing time tracking
          };
        });

        // Compliance metrics
        const onTimeSubmissions = submissions.filter(
          (s) => s.status === "passed" || s.status === "pending"
        ).length;
        const complianceRate =
          totalSubmissions > 0
            ? (onTimeSubmissions / totalSubmissions) * 100
            : 0;

        // Recent activity (last 10 submissions)
        const recentSubmissions = submissions
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 10);

        const recentActivity = await Promise.all(
          recentSubmissions.map(async (submission) => {
            const user = users.find((u) => u.id === submission.userId);
            const template = templates.find(
              (t) => t.id === submission.templateId
            );

            return {
              date: submission.createdAt,
              username: user?.username || "Unknown User",
              action: "Submitted",
              template: template?.name || "Unknown Template",
              status: submission.status,
            };
          })
        );

        const analyticsData = {
          totalSubmissions,
          submissionsByStatus,
          submissionTrends: [], // Could be calculated from historical data
          userEngagement,
          templateAnalytics,
          complianceMetrics: {
            onTimeSubmissions,
            overdueSubmissions: totalSubmissions - onTimeSubmissions,
            complianceRate,
          },
          recentActivity,
        };

        res.json(analyticsData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ error: "Failed to fetch analytics data" });
      }
    }
  );

  // Endpoint to get users for a specific category (for analytics)
  app.get(
    "/api/admin/users",
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const category = req.query.category;
        const userRole = req.user?.role;
        const userCategory = req.user?.category;

        let categoryFilter = null;
        if (userRole === "IFSCA_USER") {
          categoryFilter = userCategory;
        } else if (category && userRole === "IFSCA") {
          categoryFilter = parseInt(category as string);
        }

        const allUsers = await storage.getAllUsers();
        const users = categoryFilter
          ? allUsers.filter(
              (u) =>
                u.category === categoryFilter && u.role === "REPORTING_ENTITY"
            )
          : allUsers.filter((u) => u.role === "REPORTING_ENTITY");

        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    }
  );

  // Get all IFSCA users (IFSCA only)
  app.get(
    "/api/super-admin/ifsca-users",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log(
          "========== SUPER ADMIN IFSCA USERS ENDPOINT HIT =========="
        );
        console.log("Request user:", req.user);
        console.log("Fetching all users for super admin...");

        const users = await storage.getAllUsers();
        const categories = await storage.getCategories();
        const categoryMap = new Map(categories.map((c) => [c.id, c]));

        console.log(
          `Found ${users.length} total users:`,
          users.map((u) => ({
            id: u.id,
            username: u.username,
            role: u.role,
            category: u.category,
          }))
        );

        // Filter to only IFSCA users and exclude super admin
        const ifscaUsers = users
          .filter((user) => user.role === "IFSCA_USER")
          .map((user) => ({
            id: user.id,
            username: user.username,
            role: user.role,
            category: user.category,
            categoryData: user.category ? categoryMap.get(user.category) : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }));

        console.log(
          `Filtered to ${ifscaUsers.length} IFSCA users:`,
          ifscaUsers
        );
        console.log("About to send response...");

        // Add explicit headers to ensure JSON response
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(ifscaUsers);
        console.log("Response sent successfully");
      } catch (error) {
        console.error("Get IFSCA users error:", error);
        res.status(500).json({ error: "Failed to fetch IFSCA users" });
      }
    }
  );

  // Get all reporting entities (IFSCA only)
  app.get(
    "/api/super-admin/reporting-entities",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log(
          "========== SUPER ADMIN REPORTING ENTITIES ENDPOINT HIT =========="
        );
        console.log("Request user:", req.user);
        console.log("Fetching all users for super admin...");

        const users = await storage.getAllUsers();
        const categories = await storage.getCategories();
        const categoryMap = new Map(categories.map((c) => [c.id, c]));

        console.log(
          `Found ${users.length} total users:`,
          users.map((u) => ({
            id: u.id,
            username: u.username,
            role: u.role,
            category: u.category,
          }))
        );

        // Filter to only reporting entities
        const reportingEntities = users
          .filter((user) => user.role === "REPORTING_ENTITY")
          .map((user) => ({
            id: user.id,
            username: user.username,
            role: user.role,
            category: user.category,
            categoryData: user.category ? categoryMap.get(user.category) : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }));

        console.log(
          `Filtered to ${reportingEntities.length} reporting entities:`,
          reportingEntities
        );
        console.log("About to send response...");

        // Add explicit headers to ensure JSON response
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(reportingEntities);
        console.log("Response sent successfully");
      } catch (error) {
        console.error("Get reporting entities error:", error);
        res.status(500).json({ error: "Failed to fetch reporting entities" });
      }
    }
  );

  // Create new IFSCA user (IFSCA only)
  app.post(
    "/api/super-admin/ifsca-users",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("========== CREATE IFSCA USER ENDPOINT HIT ==========");
        console.log("Request user:", req.user);
        console.log("Request body:", req.body);

        const { username, password, categoryId } = req.body;

        // Validate required fields
        if (!username || !password || !categoryId) {
          return res
            .status(400)
            .json({ error: "Username, password, and categoryId are required" });
        }

        // Validate category exists
        const categories = await storage.getCategories();
        const categoryExists = categories.find((c) => c.id === categoryId);
        if (!categoryExists) {
          return res.status(400).json({
            error: "Invalid category ID. Category does not exist",
          });
        }

        // Check if username already exists
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create IFSCA user
        const newUser = await storage.createUser({
          username,
          password: hashedPassword,
          role: "IFSCA_USER",
          category: categoryId,
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        console.log("About to send create user response:", userWithoutPassword);

        // Ensure JSON response with explicit headers
        res.setHeader("Content-Type", "application/json");
        res.status(201).json(userWithoutPassword);
        console.log("Create user response sent successfully");
      } catch (error) {
        console.error("Create IFSCA user error:", error);
        res.status(500).json({ error: "Failed to create IFSCA user" });
      }
    }
  );

  // Update IFSCA user (IFSCA only)
  app.put(
    "/api/super-admin/ifsca-users/:id",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { username, categoryId, password } = req.body;

        // Check if user exists and is IFSCA user
        const existingUser = await storage.getUser(userId);
        if (!existingUser || existingUser.role !== "IFSCA_USER") {
          return res.status(404).json({ error: "IFSCA user not found" });
        }

        // Prepare update data
        const updateData: any = {};

        if (username) {
          // Check if new username is available
          const usernameExists = await storage.getUserByUsername(username);
          if (usernameExists && usernameExists.id !== userId) {
            return res.status(400).json({ error: "Username already exists" });
          }
          updateData.username = username;
        }

        if (categoryId) {
          const categories = await storage.getCategories();
          const categoryExists = categories.find((c) => c.id === categoryId);
          if (!categoryExists) {
            return res.status(400).json({ error: "Invalid category ID" });
          }
          updateData.category = categoryId;
        }

        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        const updatedUser = await storage.updateUser(userId, updateData);
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Update IFSCA user error:", error);
        res.status(500).json({ error: "Failed to update IFSCA user" });
      }
    }
  );

  // Category Management Endpoints (IFSCA only)

  // Get all categories
  app.get(
    "/api/super-admin/categories",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("========== GET CATEGORIES ENDPOINT HIT ==========");
        const categories = await storage.getCategories();
        res.json(categories);
      } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    }
  );

  // Create new category
  app.post(
    "/api/super-admin/categories",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("========== CREATE CATEGORY ENDPOINT HIT ==========");
        const { name, displayName, description, color, icon } = req.body;

        // Validate required fields
        if (!name || !displayName) {
          return res.status(400).json({
            error: "Name and display name are required",
          });
        }

        // Check if category already exists
        const existingCategory = await storage.getCategoryByName(name);
        if (existingCategory) {
          return res.status(409).json({
            error: "Category with this name already exists",
          });
        }

        const category = await storage.createCategory({
          name: name.toLowerCase().replace(/\s+/g, "_"),
          displayName,
          description,
          color: color || "#3B82F6",
          icon: icon || "Building",
          createdBy: req.user!.id,
        });

        res.status(201).json(category);
      } catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  );

  // Update category
  app.put(
    "/api/super-admin/categories/:id",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("========== UPDATE CATEGORY ENDPOINT HIT ==========");
        const categoryId = parseInt(req.params.id);
        const { displayName, description, color, icon } = req.body;

        const updatedCategory = await storage.updateCategory(categoryId, {
          displayName,
          description,
          color,
          icon,
        });

        res.json(updatedCategory);
      } catch (error) {
        console.error("Update category error:", error);
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  );

  // Delete category (soft delete)
  app.delete(
    "/api/super-admin/categories/:id",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("========== DELETE CATEGORY ENDPOINT HIT ==========");
        const categoryId = parseInt(req.params.id);

        await storage.deleteCategory(categoryId);
        res.json({ message: "Category deleted successfully" });
      } catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({ error: "Failed to delete category" });
      }
    }
  );

  // Super Admin Analytics - comprehensive system analytics
  app.get(
    "/api/super-admin/analytics",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("========== SUPER ADMIN ANALYTICS ENDPOINT HIT ==========");

        // Get all system data
        const [
          allUsers,
          allTemplates,
          allSubmissions,
          allCategories,
          allValidationResults,
          allComments
        ] = await Promise.all([
          storage.getAllUsers(),
          storage.getTemplates(),
          storage.getSubmissions(),
          storage.getCategories(),
          db.select().from(validationResults),
          db.select().from(comments)
        ]);

        // User Analytics
        const usersByRole = {
          super_admin: allUsers.filter(u => u.role === 'IFSCA').length,
          ifsca_user: allUsers.filter(u => u.role === 'IFSCA_USER').length,
          reporting_entity: allUsers.filter(u => u.role === 'REPORTING_ENTITY').length
        };

        const usersByCategory = allCategories.map(cat => ({
          categoryId: cat.id,
          categoryName: cat.displayName,
          ifscaUsers: allUsers.filter(u => u.role === 'IFSCA_USER' && u.category === cat.id).length,
          reportingEntities: allUsers.filter(u => u.role === 'REPORTING_ENTITY' && u.category === cat.id).length
        }));

        // Template Analytics
        const templatesByCategory = allCategories.map(cat => ({
          categoryId: cat.id,
          categoryName: cat.displayName,
          templateCount: allTemplates.filter(t => t.category === cat.id).length,
          withValidationRules: allTemplates.filter(t => t.category === cat.id && t.validationFileUploaded).length
        }));

        // Submission Analytics
        const submissionsByStatus = {
          pending: allSubmissions.filter(s => s.status === 'pending').length,
          passed: allSubmissions.filter(s => s.status === 'passed').length,
          failed: allSubmissions.filter(s => s.status === 'failed').length,
          rejected: allSubmissions.filter(s => s.status === 'rejected').length,
          returned: allSubmissions.filter(s => s.status === 'returned').length
        };

        const submissionsByCategory = allCategories.map(cat => ({
          categoryId: cat.id,
          categoryName: cat.displayName,
          totalSubmissions: allSubmissions.filter(s => s.category === cat.id).length,
          passedSubmissions: allSubmissions.filter(s => s.category === cat.id && s.status === 'passed').length,
          failedSubmissions: allSubmissions.filter(s => s.category === cat.id && s.status === 'failed').length
        }));

        // Recent Activity (last 30 submissions)
        const recentSubmissions = allSubmissions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 30);

        const recentActivity = await Promise.all(
          recentSubmissions.map(async (submission) => {
            const user = allUsers.find(u => u.id === submission.userId);
            const template = allTemplates.find(t => t.id === submission.templateId);
            const category = allCategories.find(c => c.id === submission.category);
            
            return {
              date: submission.createdAt.toISOString().split('T')[0],
              username: user?.username || 'Unknown User',
              action: 'Submitted',
              template: template?.name || 'Unknown Template',
              category: category?.displayName || 'Unknown Category',
              status: submission.status,
              reportingPeriod: submission.reportingPeriod
            };
          })
        );

        // System Health Metrics
        const totalValidationResults = allValidationResults.length;
        const failedValidations = allValidationResults.filter(vr => !vr.isValid).length;
        const systemHealthScore = totalValidationResults > 0 
          ? ((totalValidationResults - failedValidations) / totalValidationResults * 100).toFixed(1)
          : 100;

        // Monthly trends (last 12 months)
        const monthlyTrends = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          
          const monthSubmissions = allSubmissions.filter(s => {
            const submissionDate = new Date(s.createdAt);
            return submissionDate >= monthStart && submissionDate <= monthEnd;
          });

          monthlyTrends.push({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            submissions: monthSubmissions.length,
            passed: monthSubmissions.filter(s => s.status === 'passed').length,
            failed: monthSubmissions.filter(s => s.status === 'failed').length
          });
        }

        const analyticsData = {
          systemOverview: {
            totalUsers: allUsers.length,
            totalTemplates: allTemplates.length,
            totalSubmissions: allSubmissions.length,
            totalCategories: allCategories.length,
            systemHealthScore: parseFloat(systemHealthScore)
          },
          userAnalytics: {
            usersByRole,
            usersByCategory,
            totalActiveUsers: allUsers.filter(u => u.role !== 'IFSCA').length
          },
          templateAnalytics: {
            templatesByCategory,
            totalWithValidation: allTemplates.filter(t => t.validationFileUploaded).length,
            totalWithoutValidation: allTemplates.filter(t => !t.validationFileUploaded).length
          },
          submissionAnalytics: {
            submissionsByStatus,
            submissionsByCategory,
            successRate: allSubmissions.length > 0 
              ? (submissionsByStatus.passed / allSubmissions.length * 100).toFixed(1)
              : 0
          },
          complianceMetrics: {
            totalValidationRules: await db.select().from(validationRules).then(rules => rules.length),
            totalValidationResults: totalValidationResults,
            failedValidations,
            complianceRate: totalValidationResults > 0 
              ? ((totalValidationResults - failedValidations) / totalValidationResults * 100).toFixed(1)
              : 100
          },
          trends: {
            monthlyTrends,
            avgSubmissionsPerMonth: monthlyTrends.reduce((sum, month) => sum + month.submissions, 0) / 12
          },
          recentActivity,
          categories: allCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            displayName: cat.displayName,
            color: cat.color,
            isActive: cat.isActive
          }))
        };

        res.json(analyticsData);
      } catch (error) {
        console.error("Super admin analytics error:", error);
        res.status(500).json({ error: "Failed to fetch analytics data" });
      }
    }
  );

  // Clean all data except users table (IFSCA only)
  app.post(
    "/api/super-admin/clean-data",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("========== CLEAN DATA ENDPOINT HIT ==========");
        console.log("Request user:", req.user);
        console.log("Starting data cleanup process...");

        // Clean tables in order to respect foreign key constraints
        // First, delete tables that depend on others

        // Delete validation results
        await db.delete(validationResults).execute();
        console.log("✓ Deleted all validation results");

        // Delete comments
        await db.delete(comments).execute();
        console.log("✓ Deleted all comments");

        // Delete submissions
        await db.delete(submissions).execute();
        console.log("✓ Deleted all submissions");

        // Delete validation rules
        await db.delete(validationRules).execute();
        console.log("✓ Deleted all validation rules");

        // Delete template schemas
        await db.delete(templateSchemas).execute();
        console.log("✓ Deleted all template schemas");

        // Delete template sheets
        await db.delete(templateSheets).execute();
        console.log("✓ Deleted all template sheets");

        // Delete processing status
        await db.delete(processingStatus).execute();
        console.log("✓ Deleted all processing status records");

        // Delete templates
        await db.delete(templates).execute();
        console.log("✓ Deleted all templates");

        // Note: We keep users and categories tables intact

        console.log("Data cleanup completed successfully");

        res.json({
          message:
            "All data cleaned successfully (except users and categories)",
          deletedTables: [
            "validation_results",
            "comments",
            "submissions",
            "validation_rules",
            "template_schemas",
            "template_sheets",
            "processing_status",
            "templates",
          ],
        });
      } catch (error) {
        console.error("Clean data error:", error);
        res.status(500).json({ error: "Failed to clean data" });
      }
    }
  );

  // Delete IFSCA user (IFSCA only)
  app.delete(
    "/api/super-admin/ifsca-users/:id",
    requireAuth,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = parseInt(req.params.id);

        // Check if user exists and is IFSCA user
        const existingUser = await storage.getUser(userId);
        if (!existingUser || existingUser.role !== "IFSCA_USER") {
          return res.status(404).json({ error: "IFSCA user not found" });
        }

        // Check if user has any submissions or reporting entities
        const userSubmissions = await storage.getSubmissions(userId);
        if (userSubmissions.length > 0) {
          return res.status(400).json({
            error: `Cannot delete IFSCA user with ${userSubmissions.length} submissions. Please transfer or delete submissions first.`,
          });
        }

        // Delete user
        await storage.deleteUser(userId);
        res.json({ message: "IFSCA user deleted successfully" });
      } catch (error) {
        console.error("Delete IFSCA user error:", error);
        res.status(500).json({ error: "Failed to delete IFSCA user" });
      }
    }
  );

  // XBRL-specific endpoints
  
  // Parse XBRL template for schema extraction
  app.post(
    "/api/templates/:id/parse-xbrl",
    requireAuth,
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const template = await storage.getTemplate(templateId);
        
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
        }

        if (!template.isXBRL) {
          return res.status(400).json({ error: "Template is not marked as XBRL" });
        }

        // Parse XBRL template and extract taxonomy
        const xbrlTemplate = await xbrlProcessor.createXBRLTemplate(template.filePath);
        
        // Store XBRL-specific information in template
        await storage.updateTemplate(templateId, {
          xbrlTaxonomyPath: template.filePath,
          xbrlSchemaRef: xbrlTemplate.taxonomy.concepts.length > 0 ? 
            xbrlTemplate.taxonomy.concepts[0].name : ''
        });

        res.json({
          message: "XBRL template parsed successfully",
          concepts: xbrlTemplate.taxonomy.concepts,
          validationRules: xbrlTemplate.validationRules
        });
      } catch (error) {
        console.error("XBRL parsing error:", error);
        res.status(500).json({ error: "Failed to parse XBRL template" });
      }
    }
  );

  // Validate XBRL submission
  app.post(
    "/api/submissions/:id/validate-xbrl",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const submissionId = parseInt(req.params.id);
        const submission = await storage.getSubmission(submissionId);
        
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        const template = await storage.getTemplate(submission.templateId);
        if (!template || !template.isXBRL) {
          return res.status(400).json({ error: "Submission is not for XBRL template" });
        }

        // Create XBRL template from taxonomy
        const xbrlTemplate = await xbrlProcessor.createXBRLTemplate(template.xbrlTaxonomyPath!);
        
        // Validate XBRL instance
        const validationResult = await xbrlProcessor.validateXBRLInstance(
          submission.filePath,
          xbrlTemplate
        );

        // Update submission status based on validation
        const status = validationResult.isValid ? "passed" : "failed";
        await storage.updateSubmissionStatus(
          submissionId,
          status,
          req.user?.id,
          validationResult.errors.length,
          validationResult.warnings.length
        );

        res.json({
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          status
        });
      } catch (error) {
        console.error("XBRL validation error:", error);
        res.status(500).json({ error: "Failed to validate XBRL submission" });
      }
    }
  );

  // Generate XBRL report
  app.post(
    "/api/submissions/:id/generate-xbrl-report",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const submissionId = parseInt(req.params.id);
        const submission = await storage.getSubmission(submissionId);
        
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        const template = await storage.getTemplate(submission.templateId);
        if (!template || !template.isXBRL) {
          return res.status(400).json({ error: "Submission is not for XBRL template" });
        }

        // Parse XBRL instance
        const xbrlInstance = await xbrlProcessor.parseXBRLInstance(submission.filePath);
        
        // Generate report output path
        const reportPath = path.join(
          'server/uploads/reports',
          `xbrl-report-${submissionId}-${Date.now()}.xml`
        );

        // Ensure reports directory exists
        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Generate XBRL report
        await xbrlProcessor.generateXBRLReport(xbrlInstance, reportPath);

        res.json({
          message: "XBRL report generated successfully",
          reportPath: reportPath,
          downloadUrl: `/api/submissions/${submissionId}/download-xbrl-report`
        });
      } catch (error) {
        console.error("XBRL report generation error:", error);
        res.status(500).json({ error: "Failed to generate XBRL report" });
      }
    }
  );

  // Download XBRL report
  app.get(
    "/api/submissions/:id/download-xbrl-report",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const submissionId = parseInt(req.params.id);
        const submission = await storage.getSubmission(submissionId);
        
        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        // Find the report file
        const reportPattern = `xbrl-report-${submissionId}-*.xml`;
        const reportsDir = 'server/uploads/reports';
        const files = fs.readdirSync(reportsDir).filter(file => 
          file.startsWith(`xbrl-report-${submissionId}-`) && file.endsWith('.xml')
        );

        if (files.length === 0) {
          return res.status(404).json({ error: "XBRL report not found" });
        }

        const reportPath = path.join(reportsDir, files[0]);
        
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="xbrl-report-${submissionId}.xml"`);
        
        const reportStream = fs.createReadStream(reportPath);
        reportStream.pipe(res);
      } catch (error) {
        console.error("XBRL report download error:", error);
        res.status(500).json({ error: "Failed to download XBRL report" });
      }
    }
  );

  // Get XBRL template structure for user guidance
  app.get(
    "/api/templates/:id/xbrl-structure",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const template = await storage.getTemplate(templateId);
        
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
        }

        if (!template.isXBRL || !template.xbrlTaxonomyPath) {
          return res.status(400).json({ error: "Template is not XBRL or taxonomy not found" });
        }

        // Parse XBRL taxonomy
        const taxonomy = await xbrlProcessor.parseXBRLTaxonomy(template.xbrlTaxonomyPath);
        
        res.json({
          concepts: taxonomy.concepts,
          presentations: taxonomy.presentations,
          namespace: template.xbrlNamespace,
          version: template.xbrlVersion
        });
      } catch (error) {
        console.error("XBRL structure error:", error);
        res.status(500).json({ error: "Failed to get XBRL structure" });
      }
    }
  );

  const server = createServer(app);
  return server;
}

// Background validation function
async function validateSubmissionAsync(submissionId: number) {
  try {
    console.log(`Starting validation for submission ${submissionId}`);
    
    const submission = await storage.getSubmission(submissionId);
    if (!submission) {
      console.error(`Submission ${submissionId} not found`);
      return;
    }

    // Get template information
    const template = await storage.getTemplate(submission.templateId);
    if (!template) {
      console.error(
        `Template ${submission.templateId} not found for submission ${submissionId}`
      );
      return;
    }

    console.log(`Validating submission ${submissionId} with template ${template.name}`);
    console.log(`Template has validation file: ${template.validationFileUploaded}`);
    console.log(`Validation file path: ${template.validationRulesPath}`);

    // Use ModernValidationEngine for comprehensive validation
    const validationSummary = await ModernValidationEngine.validateSubmission({
      filePath: submission.filePath,
      templateId: submission.templateId,
      submissionId,
      validationRulesPath: template.validationRulesPath,
      fileName: submission.fileName
    });

    console.log(`Validation completed for submission ${submissionId}`);
    console.log(`Results: ${validationSummary.results.length} total checks`);
    console.log(`Summary: ${validationSummary.summary.errorCount} errors, ${validationSummary.summary.warningCount} warnings`);

    // Store validation results with enhanced data
    const resultsWithMetadata = validationSummary.results.map(result => ({
      submissionId: result.submissionId,
      ruleId: result.ruleId,
      field: result.field,
      ruleType: result.ruleType,
      condition: result.condition,
      cellReference: result.cellReference,
      cellValue: result.cellValue,
      message: result.errorMessage,
      severity: result.severity,
      isValid: result.isValid,
      sheetName: result.sheetName,
      rowNumber: result.rowNumber,
      columnNumber: result.rowNumber, // Map to columnNumber for compatibility
      columnName: result.columnName
    }));

    await storage.createValidationResults(resultsWithMetadata);

    // Update submission status with detailed counts
    const { errorCount, warningCount } = validationSummary.summary;
    let newStatus: 'passed' | 'failed' | 'warnings' = 'passed';
    
    if (errorCount > 0) {
      newStatus = 'failed';
    } else if (warningCount > 0) {
      newStatus = 'passed'; // Warnings don't fail the submission
    }

    await storage.updateSubmissionStatus(
      submissionId,
      newStatus,
      undefined, // updatedById
      errorCount,
      warningCount
    );

    console.log(`Submission ${submissionId} validation completed with status: ${newStatus}`);
    
  } catch (error) {
    console.error(`Error validating submission ${submissionId}:`, error);
    
    // Create a system error validation result
    await storage.createValidationResults([{
      submissionId,
      field: 'system',
      ruleType: 'system',
      condition: 'processing_error',
      errorMessage: `System error during validation: ${error.message}`,
      severity: 'error',
      isValid: false,
      cellReference: 'N/A',
      cellValue: 'N/A'
    }]);
    
    await storage.updateSubmissionStatus(submissionId, "failed", undefined, 1, 0);
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
    await storage.updateProcessingStatus(
      templateId,
      "extraction",
      "in_progress",
      "Starting sheet extraction",
      10
    );
    await storage.updateTemplateStatus(templateId, "processing");

    console.log(`Processing file: ${template.filePath}`);

    // Process file and extract data
    const result = await FileProcessor.processFile(
      template.filePath,
      templateId
    );

    if (!result.success) {
      console.error(`File processing failed: ${result.error}`);
      await storage.updateProcessingStatus(
        templateId,
        "extraction",
        "failed",
        result.error || "Failed to process file"
      );
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
            tabularTemplates: sheet.tabularTemplates || [],
          },
        });

        // Update progress for each sheet stored
        sheetProgress = 50 + Math.round(((i + 1) / result.sheets.length) * 40);
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
    await storage.updateProcessingStatus(
      templateId,
      "extraction",
      "completed",
      `Successfully extracted ${result.sheets?.length || 0} sheets`,
      100
    );

    // Generate schemas with AI
    currentStep = "ai_processing";
    await storage.updateProcessingStatus(
      templateId,
      "ai_processing",
      "in_progress",
      "Starting AI schema generation",
      0
    );

    try {
      await FileProcessor.generateSchemas(templateId);
      await storage.updateTemplateStatus(templateId, "completed");
      await storage.updateProcessingStatus(
        templateId,
        "schema_generation",
        "completed",
        "All processing completed successfully",
        100
      );
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    await storage.updateProcessingStatus(
      templateId,
      currentStep,
      "failed",
      errorMessage
    );

    // If we haven't started AI processing yet, mark it as pending
    if (currentStep === "extraction") {
      await storage.updateProcessingStatus(
        templateId,
        "ai_processing",
        "pending",
        "Waiting for extraction to complete"
      );
      await storage.updateProcessingStatus(
        templateId,
        "schema_generation",
        "pending",
        "Waiting for AI processing"
      );
    }
  }
}
