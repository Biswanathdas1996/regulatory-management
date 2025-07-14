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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: integer("role").default(0),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateType: text("template_type").notNull(),
  jsonSchema: text("json_schema"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  validationRulesPath: text("validation_rules_path"), // Path to validation rules .txt file
  validationFileUploaded: boolean("validation_file_uploaded").default(false), // Track if validation file is uploaded
  status: text("status").notNull().default("active"), // active, inactive
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
  status: text("status").notNull().default("pending"), // pending, approved, rejected, returned
  statusUpdatedBy: integer("status_updated_by").references(() => users.id),
  statusUpdatedAt: timestamp("status_updated_at"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  reportingPeriod: text("reporting_period").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add type exports
import { InferModel } from "drizzle-orm";

// Type exports
export type User = InferModel<typeof users>;
export type InsertUser = InferModel<typeof users, "insert">;

export type Template = InferModel<typeof templates>;
export type InsertTemplate = InferModel<typeof templates, "insert">;

export type TemplateSheet = InferModel<typeof templateSheets>;
export type InsertTemplateSheet = InferModel<typeof templateSheets, "insert">;

export type TemplateSchema = InferModel<typeof templateSchemas>;
export type InsertTemplateSchema = InferModel<typeof templateSchemas, "insert">;

export type ProcessingStatus = InferModel<typeof processingStatus>;
export type InsertProcessingStatus = InferModel<
  typeof processingStatus,
  "insert"
>;

export type ValidationRule = InferModel<typeof validationRules>;
export type InsertValidationRule = InferModel<typeof validationRules, "insert">;

export type Submission = InferModel<typeof submissions>;
export type InsertSubmission = InferModel<typeof submissions, "insert">;

export type ValidationResult = InferModel<typeof validationResults>;
export type InsertValidationResult = InferModel<
  typeof validationResults,
  "insert"
>;

export type Comment = InferModel<typeof comments>;
export type InsertComment = InferModel<typeof comments, "insert">;

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
