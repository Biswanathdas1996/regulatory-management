import { 
  users, 
  templates, 
  templateSheets, 
  templateSchemas, 
  processingStatus,
  type User, 
  type InsertUser, 
  type Template, 
  type InsertTemplate,
  type TemplateSheet,
  type InsertTemplateSheet,
  type TemplateSchema,
  type InsertTemplateSchema,
  type ProcessingStatus,
  type InsertProcessingStatus
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Template methods
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: number): Promise<Template | undefined>;
  getTemplates(): Promise<Template[]>;
  updateTemplateStatus(id: number, status: string): Promise<void>;
  deleteTemplate(id: number): Promise<void>;
  
  // Template sheet methods
  createTemplateSheet(sheet: InsertTemplateSheet): Promise<TemplateSheet>;
  getTemplateSheets(templateId: number): Promise<TemplateSheet[]>;
  
  // Template schema methods
  createTemplateSchema(schema: InsertTemplateSchema): Promise<TemplateSchema>;
  getTemplateSchemas(templateId: number): Promise<TemplateSchema[]>;
  getTemplateSchema(templateId: number, sheetId?: number): Promise<TemplateSchema | undefined>;
  
  // Processing status methods
  createProcessingStatus(status: InsertProcessingStatus): Promise<ProcessingStatus>;
  updateProcessingStatus(templateId: number, step: string, status: string, message?: string, progress?: number): Promise<void>;
  getProcessingStatus(templateId: number): Promise<ProcessingStatus[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.createdAt);
  }

  async updateTemplateStatus(id: number, status: string): Promise<void> {
    await db
      .update(templates)
      .set({ status, updatedAt: new Date() })
      .where(eq(templates.id, id));
  }

  async deleteTemplate(id: number): Promise<void> {
    // Delete all related data first
    await db.delete(processingStatus).where(eq(processingStatus.templateId, id));
    await db.delete(templateSchemas).where(eq(templateSchemas.templateId, id));
    await db.delete(templateSheets).where(eq(templateSheets.templateId, id));
    await db.delete(templates).where(eq(templates.id, id));
  }

  async createTemplateSheet(insertSheet: InsertTemplateSheet): Promise<TemplateSheet> {
    const [sheet] = await db
      .insert(templateSheets)
      .values(insertSheet)
      .returning();
    return sheet;
  }

  async getTemplateSheets(templateId: number): Promise<TemplateSheet[]> {
    return await db
      .select()
      .from(templateSheets)
      .where(eq(templateSheets.templateId, templateId))
      .orderBy(templateSheets.sheetIndex);
  }

  async createTemplateSchema(insertSchema: InsertTemplateSchema): Promise<TemplateSchema> {
    const [schema] = await db
      .insert(templateSchemas)
      .values(insertSchema)
      .returning();
    return schema;
  }

  async getTemplateSchemas(templateId: number): Promise<TemplateSchema[]> {
    return await db
      .select()
      .from(templateSchemas)
      .where(eq(templateSchemas.templateId, templateId));
  }

  async getTemplateSchema(templateId: number, sheetId?: number): Promise<TemplateSchema | undefined> {
    const conditions = [eq(templateSchemas.templateId, templateId)];
    if (sheetId !== undefined) {
      conditions.push(eq(templateSchemas.sheetId, sheetId));
    }
    
    const [schema] = await db
      .select()
      .from(templateSchemas)
      .where(conditions.length > 1 ? conditions[0] : conditions[0]);
    
    return schema || undefined;
  }

  async createProcessingStatus(insertStatus: InsertProcessingStatus): Promise<ProcessingStatus> {
    const [status] = await db
      .insert(processingStatus)
      .values(insertStatus)
      .returning();
    return status;
  }

  async updateProcessingStatus(templateId: number, step: string, status: string, message?: string, progress?: number): Promise<void> {
    const [existingStatus] = await db
      .select()
      .from(processingStatus)
      .where(eq(processingStatus.templateId, templateId));
    
    const matchingStatus = existingStatus && existingStatus.step === step ? existingStatus : null;
    
    if (matchingStatus) {
      await db
        .update(processingStatus)
        .set({ 
          status, 
          message: message || matchingStatus.message, 
          progress: progress !== undefined ? progress : matchingStatus.progress,
          updatedAt: new Date()
        })
        .where(eq(processingStatus.id, matchingStatus.id));
    } else {
      await this.createProcessingStatus({
        templateId,
        step,
        status,
        message,
        progress: progress || 0
      });
    }
  }

  async getProcessingStatus(templateId: number): Promise<ProcessingStatus[]> {
    return await db
      .select()
      .from(processingStatus)
      .where(eq(processingStatus.templateId, templateId))
      .orderBy(processingStatus.updatedAt);
  }
}

export const storage = new DatabaseStorage();
