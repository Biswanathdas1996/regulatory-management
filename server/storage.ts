import { 
  users, 
  templates, 
  templateSheets, 
  templateSchemas, 
  processingStatus,
  validationRules,
  submissions,
  validationResults,
  type User, 
  type InsertUser, 
  type Template, 
  type InsertTemplate,
  type TemplateSheet,
  type InsertTemplateSheet,
  type TemplateSchema,
  type InsertTemplateSchema,
  type ProcessingStatus,
  type InsertProcessingStatus,
  type ValidationRule,
  type InsertValidationRule,
  type Submission,
  type InsertSubmission,
  type ValidationResult,
  type InsertValidationResult
} from "@shared/schema";
import { db } from "./db";
import { eq, count, and } from "drizzle-orm";

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
  updateTemplateValidationRulesPath(id: number, path: string): Promise<void>;
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
  
  // Validation rules methods
  createValidationRule(rule: InsertValidationRule): Promise<ValidationRule>;
  createValidationRules(rules: InsertValidationRule[]): Promise<ValidationRule[]>;
  getValidationRules(templateId: number): Promise<ValidationRule[]>;
  deleteValidationRules(templateId: number): Promise<void>;
  
  // Submission methods
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissions(userId?: number, templateId?: number): Promise<Submission[]>;
  updateSubmissionStatus(id: number, status: string, errors?: number, warnings?: number): Promise<void>;
  getAllSubmissionsWithDetails(): Promise<any[]>;
  getUserSubmissionsWithDetails(userId: number): Promise<any[]>;
  updateSubmissionApproval(submissionId: number, action: string, adminId: number, comments?: string, assignToUserId?: number): Promise<void>;
  
  // Validation result methods
  createValidationResult(result: InsertValidationResult): Promise<ValidationResult>;
  createValidationResults(results: InsertValidationResult[]): Promise<ValidationResult[]>;
  getValidationResults(submissionId: number): Promise<ValidationResult[]>;
  deleteValidationResults(submissionId: number): Promise<void>;
  
  // User methods
  getUsers(): Promise<User[]>;
  
  // Stats methods
  getAdminStats(): Promise<any>;
  getUserStats(userId: number): Promise<any>;
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

  async updateTemplateValidationRulesPath(id: number, path: string): Promise<void> {
    await db
      .update(templates)
      .set({ validationRulesPath: path, updatedAt: new Date() })
      .where(eq(templates.id, id));
  }

  async deleteTemplate(id: number): Promise<void> {
    // Delete all related data first
    await db.delete(processingStatus).where(eq(processingStatus.templateId, id));
    await db.delete(templateSchemas).where(eq(templateSchemas.templateId, id));
    await db.delete(templateSheets).where(eq(templateSheets.templateId, id));
    await db.delete(validationRules).where(eq(validationRules.templateId, id));
    await db.delete(submissions).where(eq(submissions.templateId, id));
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

  // Validation rules methods
  async createValidationRule(rule: InsertValidationRule): Promise<ValidationRule> {
    const [validationRule] = await db
      .insert(validationRules)
      .values(rule)
      .returning();
    return validationRule;
  }

  async createValidationRules(rules: InsertValidationRule[]): Promise<ValidationRule[]> {
    return await db
      .insert(validationRules)
      .values(rules)
      .returning();
  }

  async getValidationRules(templateId: number): Promise<ValidationRule[]> {
    return await db
      .select()
      .from(validationRules)
      .where(eq(validationRules.templateId, templateId));
  }

  async deleteValidationRules(templateId: number): Promise<void> {
    await db.delete(validationRules).where(eq(validationRules.templateId, templateId));
  }

  // Submission methods
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db
      .insert(submissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getSubmissions(userId?: number, templateId?: number): Promise<Submission[]> {
    const conditions = [];
    if (userId !== undefined) {
      conditions.push(eq(submissions.userId, userId));
    }
    if (templateId !== undefined) {
      conditions.push(eq(submissions.templateId, templateId));
    }
    
    const query = db.select().from(submissions);
    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : 
        conditions.reduce((acc, condition) => acc && condition);
      return await query.where(whereClause).orderBy(submissions.submittedAt);
    }
    
    return await query.orderBy(submissions.submittedAt);
  }

  async updateSubmissionStatus(id: number, status: string, errors?: number, warnings?: number): Promise<void> {
    const updates: any = { status, validatedAt: new Date() };
    if (errors !== undefined) updates.validationErrors = errors;
    if (warnings !== undefined) updates.validationWarnings = warnings;
    
    await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, id));
  }

  // Validation result methods
  async createValidationResult(result: InsertValidationResult): Promise<ValidationResult> {
    const [validationResult] = await db
      .insert(validationResults)
      .values(result)
      .returning();
    return validationResult;
  }

  async createValidationResults(results: InsertValidationResult[]): Promise<ValidationResult[]> {
    if (results.length === 0) return [];
    return await db
      .insert(validationResults)
      .values(results)
      .returning();
  }

  async getValidationResults(submissionId: number): Promise<ValidationResult[]> {
    return await db
      .select()
      .from(validationResults)
      .where(eq(validationResults.submissionId, submissionId))
      .orderBy(validationResults.createdAt);
  }

  async deleteValidationResults(submissionId: number): Promise<void> {
    await db.delete(validationResults).where(eq(validationResults.submissionId, submissionId));
  }

  // Get all submissions with details for admin panel
  async getAllSubmissionsWithDetails(): Promise<any[]> {
    const result = await db
      .select({
        id: submissions.id,
        fileName: submissions.fileName,
        fileSize: submissions.fileSize,
        status: submissions.status,
        validationErrors: submissions.validationErrors,
        validationWarnings: submissions.validationWarnings,
        submittedAt: submissions.submittedAt,
        validatedAt: submissions.validatedAt,
        reportingPeriod: submissions.reportingPeriod,
        approvalStatus: submissions.approvalStatus,
        approvedBy: submissions.approvedBy,
        approvedAt: submissions.approvedAt,
        assignedTo: submissions.assignedTo,
        approvalComments: submissions.approvalComments,
        templateId: submissions.templateId,
        templateName: templates.name,
        userId: submissions.userId,
        username: users.username,
        userEmail: users.email
      })
      .from(submissions)
      .leftJoin(templates, eq(submissions.templateId, templates.id))
      .leftJoin(users, eq(submissions.userId, users.id))
      .orderBy(submissions.submittedAt);
    
    return result;
  }

  // Get user-specific submissions with details
  async getUserSubmissionsWithDetails(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: submissions.id,
        fileName: submissions.fileName,
        fileSize: submissions.fileSize,
        status: submissions.status,
        validationErrors: submissions.validationErrors,
        validationWarnings: submissions.validationWarnings,
        submittedAt: submissions.submittedAt,
        validatedAt: submissions.validatedAt,
        reportingPeriod: submissions.reportingPeriod,
        approvalStatus: submissions.approvalStatus,
        approvedBy: submissions.approvedBy,
        approvedAt: submissions.approvedAt,
        assignedTo: submissions.assignedTo,
        approvalComments: submissions.approvalComments,
        templateId: submissions.templateId,
        templateName: templates.name,
        version: submissions.version
      })
      .from(submissions)
      .leftJoin(templates, eq(submissions.templateId, templates.id))
      .where(eq(submissions.userId, userId))
      .orderBy(submissions.submittedAt);
    
    return result;
  }

  // Update submission approval status
  async updateSubmissionApproval(submissionId: number, action: string, adminId: number, comments?: string, assignToUserId?: number): Promise<void> {
    const updates: any = {
      approvalStatus: action,
      approvedBy: adminId,
      approvedAt: new Date(),
      approvalComments: comments
    };

    if (assignToUserId !== undefined) {
      updates.assignedTo = assignToUserId;
    }

    await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, submissionId));
  }

  // Get all users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  // Get admin statistics
  async getAdminStats(): Promise<any> {
    const [totalSubmissions] = await db
      .select({ count: count() })
      .from(submissions);
    
    const [pendingSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.approvalStatus, 'pending'));
    
    const [approvedSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.approvalStatus, 'approved'));
    
    const [rejectedSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.approvalStatus, 'rejected'));
    
    const [totalTemplates] = await db
      .select({ count: count() })
      .from(templates);
    
    const [totalUsers] = await db
      .select({ count: count() })
      .from(users);

    return {
      totalSubmissions: totalSubmissions?.count || 0,
      pendingSubmissions: pendingSubmissions?.count || 0,
      approvedSubmissions: approvedSubmissions?.count || 0,
      rejectedSubmissions: rejectedSubmissions?.count || 0,
      totalTemplates: totalTemplates?.count || 0,
      totalUsers: totalUsers?.count || 0
    };
  }

  // Get user statistics
  async getUserStats(userId: number): Promise<any> {
    const [totalSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.userId, userId));
    
    const [pendingSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(and(
        eq(submissions.userId, userId),
        eq(submissions.approvalStatus, 'pending')
      ));
    
    const [approvedSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(and(
        eq(submissions.userId, userId),
        eq(submissions.approvalStatus, 'approved')
      ));
    
    const [rejectedSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(and(
        eq(submissions.userId, userId),
        eq(submissions.approvalStatus, 'rejected')
      ));

    return {
      totalSubmissions: totalSubmissions?.count || 0,
      pendingSubmissions: pendingSubmissions?.count || 0,
      approvedSubmissions: approvedSubmissions?.count || 0,
      rejectedSubmissions: rejectedSubmissions?.count || 0
    };
  }
}

export const storage = new DatabaseStorage();
