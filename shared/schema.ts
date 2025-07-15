import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Categories table for dynamic category management
export const categoryTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // banking, nbfc, stock_exchange, etc.
  displayName: text("display_name").notNull(), // Banking, NBFC, Stock Exchange, etc.
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for UI
  icon: text("icon").default("Building"), // Lucide icon name
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by"), // Will be set as foreign key after users table is created
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table - moved after categoryTable to resolve circular dependency
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("reporting_entity"), // super_admin, ifsca_user, reporting_entity
  category: integer("category").references(() => categoryTable.id),
  createdBy: integer("created_by"), // ID of user who created this user
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments table for submission discussions
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  userId: integer("user_id").notNull(),
  parentCommentId: integer("parent_comment_id"), // for replies
  text: text("text").notNull(),
  systemGenerated: boolean("system_generated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateType: text("template_type"), // Made optional - can be removed entirely in future
  category: integer("category")
    .notNull()
    .references(() => categoryTable.id), // Reference to categories table
  frequency: text("frequency", {
    enum: ["daily", "weekly", "monthly", "quarterly", "half_yearly", "yearly"],
  }).notNull(),
  lastSubmissionDate: timestamp("last_submission_date"),
  jsonSchema: text("json_schema"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  validationRulesPath: text("validation_rules_path"), // Path to validation rules .txt file
  validationFileUploaded: boolean("validation_file_uploaded").default(false), // Track if validation file is uploaded
  status: text("status").notNull().default("active"), // active, inactive
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(), // ID of IFSCA user who created this template
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const templateSheets = pgTable("template_sheets", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  sheetName: text("sheet_name").notNull(),
  sheetIndex: integer("sheet_index").notNull(),
  dataPointCount: integer("data_point_count").notNull(),
  extractedData: json("extracted_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Validation rules for templates (sheet-specific)
export const validationRules = pgTable("validation_rules", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  sheetId: integer("sheet_id").references(() => templateSheets.id), // Made optional for backward compatibility
  ruleType: text("rule_type").notNull(), // required, format, range, custom
  field: text("field").notNull(), // Field name or cell reference
  condition: text("condition").notNull(), // Validation condition
  errorMessage: text("error_message").notNull(),
  severity: text("severity").notNull().default("error"), // error, warning
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Validation results for submissions
export const validationResults = pgTable("validation_results", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .references(() => submissions.id)
    .notNull(),
  ruleId: integer("rule_id").references(() => validationRules.id),
  field: text("field").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("error"), // error, warning
  rowNumber: integer("row_number"),
  columnNumber: integer("column_number"),
  cellValue: text("cell_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Template schemas table
export const templateSchemas = pgTable("template_schemas", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  sheetId: integer("sheet_id").references(() => templateSheets.id),
  schemaData: json("schema_data").notNull(),
  aiConfidence: integer("ai_confidence").notNull(),
  extractionNotes: text("extraction_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const processingStatus = pgTable("processing_status", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  step: text("step").notNull(), // upload, extraction, ai_processing, schema_generation
  status: text("status").notNull(), // pending, in_progress, completed, failed
  message: text("message"),
  progress: integer("progress").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User submissions
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  category: integer("category")
    .references(() => categoryTable.id)
    .notNull(), // Reference to category table
  status: text("status").notNull().default("pending"), // pending, approved, rejected, returned
  statusUpdatedBy: integer("status_updated_by").references(() => users.id),
  statusUpdatedAt: timestamp("status_updated_at"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  reportingPeriod: text("reporting_period").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports using modern Drizzle syntax
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

export type TemplateSheet = typeof templateSheets.$inferSelect;
export type InsertTemplateSheet = typeof templateSheets.$inferInsert;

export type TemplateSchema = typeof templateSchemas.$inferSelect;
export type InsertTemplateSchema = typeof templateSchemas.$inferInsert;

export type ProcessingStatus = typeof processingStatus.$inferSelect;
export type InsertProcessingStatus = typeof processingStatus.$inferInsert;

export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertValidationRule = typeof validationRules.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

export type ValidationResult = typeof validationResults.$inferSelect;
export type InsertValidationResult = typeof validationResults.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export type Category = typeof categoryTable.$inferSelect;
export type InsertCategory = typeof categoryTable.$inferInsert;

// User role constants
export const userRoles = [
  "super_admin",
  "ifsca_user",
  "reporting_entity",
] as const;

// Category constants
export const categories = ["banking", "nbfc", "stock_exchange"] as const;

// Template types array
export const templateTypes = [
  "monthly-clearing",
  "quarterly-capital",
  "liabilities",
  "stock-mar",
  "stock-mdr",
  "treasury",
];

// Zod schemas for validation
export const insertTemplateSchema = createInsertSchema(templates);
export const insertTemplateSheetSchema = createInsertSchema(templateSheets);
