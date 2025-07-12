import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"), // admin, user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateType: text("template_type").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  validationRulesPath: text("validation_rules_path"), // Path to validation rules .txt file
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const templateSheets = pgTable("template_sheets", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  sheetName: text("sheet_name").notNull(),
  sheetIndex: integer("sheet_index").notNull(),
  dataPointCount: integer("data_point_count").notNull(),
  extractedData: json("extracted_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templateSchemas = pgTable("template_schemas", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  sheetId: integer("sheet_id").references(() => templateSheets.id),
  schemaData: json("schema_data").notNull(),
  aiConfidence: integer("ai_confidence").notNull(),
  extractionNotes: text("extraction_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const processingStatus = pgTable("processing_status", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  step: text("step").notNull(), // upload, extraction, ai_processing, schema_generation
  status: text("status").notNull(), // pending, in_progress, completed, failed
  message: text("message"),
  progress: integer("progress").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Validation rules for templates (sheet-specific)
export const validationRules = pgTable("validation_rules", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  sheetId: integer("sheet_id").references(() => templateSheets.id), // Made optional for backward compatibility
  ruleType: text("rule_type").notNull(), // required, format, range, custom
  field: text("field").notNull(), // Field name or cell reference
  condition: text("condition").notNull(), // Validation condition
  errorMessage: text("error_message").notNull(),
  severity: text("severity").notNull().default("error"), // error, warning
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User submissions with approval workflow
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  reportingPeriod: text("reporting_period").notNull(),
  status: text("status").notNull().default("pending"), // pending, validating, validated, approved, rejected, reassigned
  approvalStatus: text("approval_status"), // pending_approval, approved, rejected, reassigned
  approvedBy: integer("approved_by").references(() => users.id),
  approvalComments: text("approval_comments"),
  assignedTo: integer("assigned_to").references(() => users.id),
  validationErrors: integer("validation_errors").default(0),
  validationWarnings: integer("validation_warnings").default(0),
  version: integer("version").notNull().default(1),
  parentSubmissionId: integer("parent_submission_id"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  validatedAt: timestamp("validated_at"),
  approvedAt: timestamp("approved_at"),
});

// Validation results for each submission
export const validationResults = pgTable("validation_results", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").references(() => submissions.id).notNull(),
  ruleId: integer("rule_id").references(() => validationRules.id).notNull(),
  field: text("field").notNull(),
  value: text("value"),
  passed: boolean("passed").notNull(),
  errorMessage: text("error_message"),
  severity: text("severity").notNull(), // error, warning
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templateTypes = [
  "monthly-clearing",
  "quarterly-capital",
  "liabilities",
  "stock-mar",
  "stock-mdr",
  "treasury"
] as const;

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  templateType: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  validationRulesPath: true,
});

export const insertTemplateSheetSchema = createInsertSchema(templateSheets).pick({
  templateId: true,
  sheetName: true,
  sheetIndex: true,
  dataPointCount: true,
  extractedData: true,
});

export const insertTemplateSchemaSchema = createInsertSchema(templateSchemas).pick({
  templateId: true,
  sheetId: true,
  schemaData: true,
  aiConfidence: true,
  extractionNotes: true,
});

export const insertProcessingStatusSchema = createInsertSchema(processingStatus).pick({
  templateId: true,
  step: true,
  status: true,
  message: true,
  progress: true,
});

export const insertValidationRuleSchema = createInsertSchema(validationRules).pick({
  templateId: true,
  sheetId: true,
  ruleType: true,
  field: true,
  condition: true,
  errorMessage: true,
  severity: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  templateId: true,
  userId: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  reportingPeriod: true,
});

export const insertValidationResultSchema = createInsertSchema(validationResults).pick({
  submissionId: true,
  ruleId: true,
  field: true,
  value: true,
  passed: true,
  errorMessage: true,
  severity: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplateSheet = z.infer<typeof insertTemplateSheetSchema>;
export type TemplateSheet = typeof templateSheets.$inferSelect;
export type InsertTemplateSchema = z.infer<typeof insertTemplateSchemaSchema>;
export type TemplateSchema = typeof templateSchemas.$inferSelect;
export type InsertProcessingStatus = z.infer<typeof insertProcessingStatusSchema>;
export type ProcessingStatus = typeof processingStatus.$inferSelect;
export type InsertValidationRule = z.infer<typeof insertValidationRuleSchema>;
export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertValidationResult = z.infer<typeof insertValidationResultSchema>;
export type ValidationResult = typeof validationResults.$inferSelect;
export type TemplateType = typeof templateTypes[number];

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});
