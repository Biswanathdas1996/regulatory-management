import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Categories table for dynamic category management
export const categoryTable = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // banking, nbfc, stock_exchange, etc.
  displayName: text("display_name").notNull(), // Banking, NBFC, Stock Exchange, etc.
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for UI
  icon: text("icon").default("Building"), // Lucide icon name
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdBy: integer("created_by"), // Will be set as foreign key after users table is created
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Users table - moved after categoryTable to resolve circular dependency
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("reporting_entity"), // super_admin, ifsca_user, reporting_entity
  category: integer("category").references(() => categoryTable.id),
  createdBy: integer("created_by"), // ID of user who created this user
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Comments table for submission discussions
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: integer("submission_id").notNull(),
  userId: integer("user_id").notNull(),
  parentCommentId: integer("parent_comment_id"), // for replies
  text: text("text").notNull(),
  systemGenerated: integer("system_generated", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  templateType: text("template_type"), // Made optional - can be removed entirely in future
  category: integer("category")
    .notNull()
    .references(() => categoryTable.id), // Reference to categories table
  frequency: text("frequency").notNull(), // daily, weekly, monthly, quarterly, half_yearly, yearly
  lastSubmissionDate: text("last_submission_date"),
  jsonSchema: text("json_schema"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  validationRulesPath: text("validation_rules_path"), // Path to validation rules .txt file
  validationFileUploaded: integer("validation_file_uploaded", { mode: "boolean" }).default(false), // Track if validation file is uploaded
  status: text("status").notNull().default("active"), // active, inactive
  // XBRL-specific fields
  isXBRL: integer("is_xbrl", { mode: "boolean" }).default(false), // Flag to indicate if this is an XBRL template
  xbrlTaxonomyPath: text("xbrl_taxonomy_path"), // Path to XBRL taxonomy schema
  xbrlSchemaRef: text("xbrl_schema_ref"), // Reference to XBRL schema
  xbrlNamespace: text("xbrl_namespace"), // XBRL namespace for this template
  xbrlVersion: text("xbrl_version").default("2.1"), // XBRL version
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(), // ID of IFSCA user who created this template
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const templateSheets = sqliteTable("template_sheets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  sheetName: text("sheet_name").notNull(),
  sheetIndex: integer("sheet_index").notNull(),
  dataPointCount: integer("data_point_count").notNull(),
  extractedData: text("extracted_data"), // JSON stored as text
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Validation rules for templates (sheet-specific)
export const validationRules = sqliteTable("validation_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  sheetId: integer("sheet_id").references(() => templateSheets.id), // Made optional for backward compatibility
  ruleType: text("rule_type").notNull(), // required, format, range, custom
  field: text("field").notNull(), // Field name or cell reference
  condition: text("condition").notNull(), // Validation condition
  errorMessage: text("error_message").notNull(),
  severity: text("severity").notNull().default("error"), // error, warning
  rowRange: text("row_range"), // e.g., "2-100", "5", "10-*" for row-specific validation
  columnRange: text("column_range"), // e.g., "A-Z", "B", "C-E" for column-specific validation
  cellRange: text("cell_range"), // e.g., "A2:Z100", "B5", "C1:C50" for exact cell range validation
  applyToAllRows: integer("apply_to_all_rows", { mode: "boolean" }).default(false), // If true, applies to all rows in the range
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Validation results for submissions
export const validationResults = sqliteTable("validation_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: integer("submission_id")
    .references(() => submissions.id)
    .notNull(),
  ruleId: integer("rule_id").references(() => validationRules.id),
  field: text("field").notNull(),
  ruleType: text("rule_type"),
  condition: text("condition"),
  cellReference: text("cell_reference"),
  cellValue: text("cell_value"),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("error"), // error, warning
  isValid: integer("is_valid", { mode: "boolean" }).notNull().default(false),
  sheetName: text("sheet_name"),
  rowNumber: integer("row_number"),
  columnNumber: integer("column_number"),
  columnName: text("column_name"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Template schemas table
export const templateSchemas = sqliteTable("template_schemas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  sheetId: integer("sheet_id").references(() => templateSheets.id),
  schemaData: text("schema_data").notNull(), // JSON stored as text
  aiConfidence: integer("ai_confidence").notNull(),
  extractionNotes: text("extraction_notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const processingStatus = sqliteTable("processing_status", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull().unique(),
  templateId: integer("template_id").references(() => templates.id),
  currentChunk: integer("current_chunk").notNull().default(0),
  totalChunks: integer("total_chunks").notNull().default(0),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Submissions table for uploaded user data
export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  reportingPeriod: text("reporting_period").notNull(),
  status: text("status").notNull().default("pending"), // pending, validating, passed, failed, rejected, returned
  errorCount: integer("error_count").default(0),
  warningCount: integer("warning_count").default(0),
  processingTime: integer("processing_time"), // in milliseconds
  category: integer("category").references(() => categoryTable.id),
  rejectionReason: text("rejection_reason"), // Reason for rejection by admin
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Add Zod schemas for inserts
export const insertCategorySchema = createInsertSchema(categoryTable);
export const insertUserSchema = createInsertSchema(users);
export const insertTemplateSchema = createInsertSchema(templates);
export const insertSubmissionSchema = createInsertSchema(submissions);
export const insertValidationRuleSchema = createInsertSchema(validationRules);
export const insertValidationResultSchema = createInsertSchema(validationResults);

// Types
export type Category = typeof categoryTable.$inferSelect;
export type InsertCategory = typeof categoryTable.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;
export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertValidationRule = typeof validationRules.$inferInsert;
export type ValidationResult = typeof validationResults.$inferSelect;
export type InsertValidationResult = typeof validationResults.$inferInsert;