import {
  users,
  templates,
  templateSheets,
  templateSchemas,
  processingStatus,
  validationRules,
  submissions,
  validationResults,
  comments,
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
  type InsertValidationResult,
  type Comment,
  type InsertComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Template methods
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: number): Promise<Template | undefined>;
  getTemplates(): Promise<Template[]>;
  updateTemplateStatus(id: number, status: string): Promise<void>;
  updateTemplateValidationRulesPath(id: number, path: string): Promise<void>;
  updateValidationFileUploaded(id: number, uploaded: boolean): Promise<void>;
  deleteTemplate(id: number): Promise<void>;

  // Template sheet methods
  createTemplateSheet(sheet: InsertTemplateSheet): Promise<TemplateSheet>;
  getTemplateSheets(templateId: number): Promise<TemplateSheet[]>;

  // Template schema methods
  createTemplateSchema(schema: InsertTemplateSchema): Promise<TemplateSchema>;
  getTemplateSchemas(templateId: number): Promise<TemplateSchema[]>;
  getTemplateSchema(
    templateId: number,
    sheetId?: number
  ): Promise<TemplateSchema | undefined>;

  // Processing status methods
  createProcessingStatus(
    status: InsertProcessingStatus
  ): Promise<ProcessingStatus>;
  updateProcessingStatus(
    templateId: number,
    step: string,
    status: string,
    message?: string,
    progress?: number
  ): Promise<void>;
  getProcessingStatus(templateId: number): Promise<ProcessingStatus[]>;

  // Validation rules methods
  createValidationRule(rule: InsertValidationRule): Promise<ValidationRule>;
  createValidationRules(
    rules: InsertValidationRule[]
  ): Promise<ValidationRule[]>;
  getValidationRules(templateId: number): Promise<ValidationRule[]>;
  deleteValidationRules(templateId: number): Promise<void>;

  // Submission methods
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissions(userId?: number, templateId?: number): Promise<Submission[]>;
  updateSubmissionStatus(
    submissionId: number,
    status:
      | "pending"
      | "approved"
      | "rejected"
      | "returned"
      | "passed"
      | "failed",
    updatedById?: number | undefined,
    errors?: number,
    warnings?: number
  ): Promise<void>;
  deleteSubmission(id: number): Promise<void>;

  // Validation result methods
  createValidationResult(
    result: InsertValidationResult
  ): Promise<ValidationResult>;
  createValidationResults(
    results: InsertValidationResult[]
  ): Promise<ValidationResult[]>;
  getValidationResults(submissionId: number): Promise<ValidationResult[]>;
  deleteValidationResults(submissionId: number): Promise<void>;

  // Comment methods
  getComments(submissionId: number): Promise<Comment[]>;
  createComment(data: {
    submissionId: number;
    userId: number;
    text: string;
    parentCommentId?: number | null;
    systemGenerated?: boolean;
  }): Promise<Comment>;
  getCommentsWithUsers(
    submissionId: number
  ): Promise<(Comment & { username: string })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id));
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

  async updateTemplateValidationRulesPath(
    id: number,
    path: string
  ): Promise<void> {
    await db
      .update(templates)
      .set({ validationRulesPath: path, updatedAt: new Date() })
      .where(eq(templates.id, id));
  }

  async updateValidationFileUploaded(id: number, uploaded: boolean): Promise<void> {
    await db
      .update(templates)
      .set({ validationFileUploaded: uploaded, updatedAt: new Date() })
      .where(eq(templates.id, id));
  }

  async deleteTemplate(id: number): Promise<void> {
    // Delete all related data first
    await db
      .delete(processingStatus)
      .where(eq(processingStatus.templateId, id));
    await db.delete(templateSchemas).where(eq(templateSchemas.templateId, id));
    await db.delete(templateSheets).where(eq(templateSheets.templateId, id));
    await db.delete(validationRules).where(eq(validationRules.templateId, id));
    await db.delete(submissions).where(eq(submissions.templateId, id));
    await db.delete(templates).where(eq(templates.id, id));
  }

  async createTemplateSheet(
    insertSheet: InsertTemplateSheet
  ): Promise<TemplateSheet> {
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

  async createTemplateSchema(
    insertSchema: InsertTemplateSchema
  ): Promise<TemplateSchema> {
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

  async getTemplateSchema(
    templateId: number,
    sheetId?: number
  ): Promise<TemplateSchema | undefined> {
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

  async createProcessingStatus(
    insertStatus: InsertProcessingStatus
  ): Promise<ProcessingStatus> {
    const [status] = await db
      .insert(processingStatus)
      .values(insertStatus)
      .returning();
    return status;
  }

  async updateProcessingStatus(
    templateId: number,
    step: string,
    status: string,
    message?: string,
    progress?: number
  ): Promise<void> {
    const [existingStatus] = await db
      .select()
      .from(processingStatus)
      .where(eq(processingStatus.templateId, templateId));

    const matchingStatus =
      existingStatus && existingStatus.step === step ? existingStatus : null;

    if (matchingStatus) {
      await db
        .update(processingStatus)
        .set({
          status,
          message: message || matchingStatus.message,
          progress: progress !== undefined ? progress : matchingStatus.progress,
          updatedAt: new Date(),
        })
        .where(eq(processingStatus.id, matchingStatus.id));
    } else {
      await this.createProcessingStatus({
        templateId,
        step,
        status,
        message,
        progress: progress || 0,
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
  async createValidationRule(
    rule: InsertValidationRule
  ): Promise<ValidationRule> {
    const [validationRule] = await db
      .insert(validationRules)
      .values(rule)
      .returning();
    return validationRule;
  }

  async createValidationRules(
    rules: InsertValidationRule[]
  ): Promise<ValidationRule[]> {
    return await db.insert(validationRules).values(rules).returning();
  }

  async getValidationRules(templateId: number): Promise<ValidationRule[]> {
    return await db
      .select()
      .from(validationRules)
      .where(eq(validationRules.templateId, templateId));
  }

  async deleteValidationRules(templateId: number): Promise<void> {
    await db
      .delete(validationRules)
      .where(eq(validationRules.templateId, templateId));
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
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getSubmissions(
    userId?: number,
    templateId?: number
  ): Promise<Submission[]> {
    const conditions = [];
    if (userId !== undefined) {
      conditions.push(eq(submissions.userId, userId));
    }
    if (templateId !== undefined) {
      conditions.push(eq(submissions.templateId, templateId));
    }

    const query = db.select().from(submissions);
    if (conditions.length > 0) {
      const whereClause =
        conditions.length === 1
          ? conditions[0]
          : conditions.reduce((acc, condition) => acc && condition);
      return await query.where(whereClause).orderBy(submissions.createdAt);
    }

    return await query.orderBy(submissions.createdAt);
  }

  // Update submission status
  async updateSubmissionStatus(
    submissionId: number,
    status:
      | "pending"
      | "approved"
      | "rejected"
      | "returned"
      | "passed"
      | "failed",
    updatedById?: number | undefined,
    errors?: number,
    warnings?: number
  ) {
    const updates: any = {
      status,
      statusUpdatedBy: updatedById,
      statusUpdatedAt: new Date(),
    };

    // Legacy support for validation status updates
    if (errors !== undefined) updates.validationErrors = errors;
    if (warnings !== undefined) updates.validationWarnings = warnings;
    if (status === "passed" || status === "failed") {
      updates.validatedAt = new Date();
    }

    await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, submissionId));
  }

  // Validation result methods
  async createValidationResult(
    result: InsertValidationResult
  ): Promise<ValidationResult> {
    const [validationResult] = await db
      .insert(validationResults)
      .values(result)
      .returning();
    return validationResult;
  }

  async createValidationResults(
    results: InsertValidationResult[]
  ): Promise<ValidationResult[]> {
    if (results.length === 0) return [];
    return await db.insert(validationResults).values(results).returning();
  }

  async getValidationResults(
    submissionId: number
  ): Promise<ValidationResult[]> {
    return await db
      .select()
      .from(validationResults)
      .where(eq(validationResults.submissionId, submissionId))
      .orderBy(validationResults.createdAt);
  }

  async deleteValidationResults(submissionId: number): Promise<void> {
    await db
      .delete(validationResults)
      .where(eq(validationResults.submissionId, submissionId));
  }

  async deleteSubmission(id: number): Promise<void> {
    await db.delete(submissions).where(eq(submissions.id, id));
  }

  async getComments(submissionId: number) {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.submissionId, submissionId))
      .orderBy(comments.createdAt);
  }

  async createComment(data: {
    submissionId: number;
    userId: number;
    text: string;
    parentCommentId?: number | null;
    systemGenerated?: boolean;
  }) {
    const comment = await db
      .insert(comments)
      .values({
        submissionId: data.submissionId,
        userId: data.userId,
        parentCommentId: data.parentCommentId || null,
        text: data.text,
        systemGenerated: data.systemGenerated || false,
      })
      .returning();

    return comment[0];
  }

  async getCommentsWithUsers(submissionId: number) {
    const allComments = await this.getComments(submissionId);
    const userIdSet = new Set(allComments.map((c) => c.userId));
    const userIds = Array.from(userIdSet);

    const userList =
      userIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, userIds))
        : [];

    const userMap = new Map(userList.map((user) => [user.id, user.username]));

    return allComments.map((comment) => ({
      ...comment,
      username: userMap.get(comment.userId) || `User ${comment.userId}`,
    }));
  }
}

export const storage = new DatabaseStorage();
