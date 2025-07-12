import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateType: text("template_type").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
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
export type TemplateType = typeof templateTypes[number];

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
