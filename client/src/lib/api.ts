import { httpClient } from "@/lib/httpClient";
import type { User } from "@/contexts/AuthContext";

// Auth API endpoints
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    httpClient.post<User>("/api/auth/login", credentials),

  logout: () => httpClient.post<{ message: string }>("/api/auth/logout"),

  getCurrentUser: () => httpClient.get<User>("/api/auth/me"),
};

// Templates API endpoints
export const templatesApi = {
  getAll: () => httpClient.get<any[]>("/api/templates"),

  getById: (id: string | number) => httpClient.get<any>(`/api/templates/${id}`),

  create: (templateData: any) =>
    httpClient.post<any>("/api/templates", templateData),

  update: (id: string | number, templateData: any) =>
    httpClient.put<any>(`/api/templates/${id}`, templateData),

  delete: (id: string | number) =>
    httpClient.delete<any>(`/api/templates/${id}`),

  upload: (formData: FormData) =>
    httpClient.upload<any>("/api/templates/upload", formData),
};

// Submissions API endpoints
export const submissionsApi = {
  getAll: () => httpClient.get<any[]>("/api/submissions"),

  getById: (id: string | number) =>
    httpClient.get<any>(`/api/submissions/${id}`),

  getUserSubmissions: () => httpClient.get<any[]>("/api/submissions/user"),

  create: (submissionData: any) =>
    httpClient.post<any>("/api/submissions", submissionData),

  update: (id: string | number, submissionData: any) =>
    httpClient.put<any>(`/api/submissions/${id}`, submissionData),

  delete: (id: string | number) =>
    httpClient.delete<any>(`/api/submissions/${id}`),

  upload: (formData: FormData) =>
    httpClient.upload<any>("/api/submissions/upload", formData),

  validate: (id: string | number) =>
    httpClient.post<any>(`/api/submissions/${id}/validate`),
};

// Validation API endpoints
export const validationApi = {
  getRules: () => httpClient.get<any[]>("/api/validation/rules"),

  updateRules: (rules: any) =>
    httpClient.put<any>("/api/validation/rules", rules),

  validateFile: (formData: FormData) =>
    httpClient.upload<any>("/api/validation/validate", formData),
};

// Admin API endpoints (require admin authentication)
export const adminApi = {
  // User management
  getUsers: () => httpClient.get<any[]>("/api/admin/users"),

  createUser: (userData: any) =>
    httpClient.post<any>("/api/admin/users", userData),

  updateUser: (id: string | number, userData: any) =>
    httpClient.put<any>(`/api/admin/users/${id}`, userData),

  deleteUser: (id: string | number) =>
    httpClient.delete<any>(`/api/admin/users/${id}`),

  // Template management
  getTemplates: () => httpClient.get<any[]>("/api/admin/templates"),

  // Submission management
  getSubmissions: () => httpClient.get<any[]>("/api/admin/submissions"),

  updateSubmissionStatus: (id: string | number, status: string) =>
    httpClient.patch<any>(`/api/admin/submissions/${id}/status`, { status }),

  // System stats
  getStats: () => httpClient.get<any>("/api/admin/stats"),
};

// File management API endpoints
export const filesApi = {
  upload: (formData: FormData) =>
    httpClient.upload<any>("/api/files/upload", formData),

  delete: (filename: string) =>
    httpClient.delete<any>(`/api/files/${filename}`),

  download: (filename: string) =>
    httpClient.get<Blob>(`/api/files/${filename}`, {
      headers: {
        Accept: "application/octet-stream",
      },
    }),
};
