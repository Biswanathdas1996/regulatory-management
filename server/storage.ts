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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private templates: Map<number, Template>;
  private templateSheets: Map<number, TemplateSheet>;
  private templateSchemas: Map<number, TemplateSchema>;
  private processingStatuses: Map<number, ProcessingStatus>;
  private currentUserId: number;
  private currentTemplateId: number;
  private currentSheetId: number;
  private currentSchemaId: number;
  private currentStatusId: number;

  constructor() {
    this.users = new Map();
    this.templates = new Map();
    this.templateSheets = new Map();
    this.templateSchemas = new Map();
    this.processingStatuses = new Map();
    this.currentUserId = 1;
    this.currentTemplateId = 1;
    this.currentSheetId = 1;
    this.currentSchemaId = 1;
    this.currentStatusId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const now = new Date();
    const template: Template = { 
      ...insertTemplate, 
      id, 
      status: "uploaded",
      createdAt: now,
      updatedAt: now
    };
    this.templates.set(id, template);
    return template;
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateTemplateStatus(id: number, status: string): Promise<void> {
    const template = this.templates.get(id);
    if (template) {
      template.status = status;
      template.updatedAt = new Date();
      this.templates.set(id, template);
    }
  }

  async deleteTemplate(id: number): Promise<void> {
    this.templates.delete(id);
    // Clean up related data
    Array.from(this.templateSheets.entries()).forEach(([key, sheet]) => {
      if (sheet.templateId === id) {
        this.templateSheets.delete(key);
      }
    });
    Array.from(this.templateSchemas.entries()).forEach(([key, schema]) => {
      if (schema.templateId === id) {
        this.templateSchemas.delete(key);
      }
    });
    Array.from(this.processingStatuses.entries()).forEach(([key, status]) => {
      if (status.templateId === id) {
        this.processingStatuses.delete(key);
      }
    });
  }

  async createTemplateSheet(insertSheet: InsertTemplateSheet): Promise<TemplateSheet> {
    const id = this.currentSheetId++;
    const sheet: TemplateSheet = { 
      ...insertSheet, 
      id,
      createdAt: new Date(),
      extractedData: insertSheet.extractedData || null
    };
    this.templateSheets.set(id, sheet);
    return sheet;
  }

  async getTemplateSheets(templateId: number): Promise<TemplateSheet[]> {
    return Array.from(this.templateSheets.values()).filter(
      sheet => sheet.templateId === templateId
    ).sort((a, b) => a.sheetIndex - b.sheetIndex);
  }

  async createTemplateSchema(insertSchema: InsertTemplateSchema): Promise<TemplateSchema> {
    const id = this.currentSchemaId++;
    const schema: TemplateSchema = { 
      ...insertSchema, 
      id,
      createdAt: new Date(),
      sheetId: insertSchema.sheetId || null,
      extractionNotes: insertSchema.extractionNotes || null
    };
    this.templateSchemas.set(id, schema);
    return schema;
  }

  async getTemplateSchemas(templateId: number): Promise<TemplateSchema[]> {
    return Array.from(this.templateSchemas.values()).filter(
      schema => schema.templateId === templateId
    );
  }

  async getTemplateSchema(templateId: number, sheetId?: number): Promise<TemplateSchema | undefined> {
    return Array.from(this.templateSchemas.values()).find(
      schema => schema.templateId === templateId && (!sheetId || schema.sheetId === sheetId)
    );
  }

  async createProcessingStatus(insertStatus: InsertProcessingStatus): Promise<ProcessingStatus> {
    const id = this.currentStatusId++;
    const status: ProcessingStatus = { 
      ...insertStatus, 
      id,
      updatedAt: new Date(),
      message: insertStatus.message || null,
      progress: insertStatus.progress || null
    };
    this.processingStatuses.set(id, status);
    return status;
  }

  async updateProcessingStatus(templateId: number, step: string, status: string, message?: string, progress?: number): Promise<void> {
    const existingStatus = Array.from(this.processingStatuses.values()).find(
      s => s.templateId === templateId && s.step === step
    );
    
    if (existingStatus) {
      existingStatus.status = status;
      existingStatus.message = message || existingStatus.message;
      existingStatus.progress = progress !== undefined ? progress : existingStatus.progress;
      existingStatus.updatedAt = new Date();
      this.processingStatuses.set(existingStatus.id, existingStatus);
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
    return Array.from(this.processingStatuses.values()).filter(
      status => status.templateId === templateId
    ).sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
  }
}

export const storage = new MemStorage();
