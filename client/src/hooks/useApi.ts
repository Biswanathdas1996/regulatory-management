import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  templatesApi,
  submissionsApi,
  validationApi,
  adminApi,
  filesApi,
} from "@/lib/api";

// Query keys for caching
export const queryKeys = {
  templates: ["templates"] as const,
  template: (id: string | number) => ["templates", id] as const,
  submissions: ["submissions"] as const,
  submission: (id: string | number) => ["submissions", id] as const,
  userSubmissions: ["submissions", "user"] as const,
  validationRules: ["validation", "rules"] as const,
  adminUsers: ["admin", "users"] as const,
  adminStats: ["admin", "stats"] as const,
} as const;

// Templates hooks
export const useTemplates = () => {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: templatesApi.getAll,
  });
};

export const useTemplate = (id: string | number) => {
  return useQuery({
    queryKey: queryKeys.template(id),
    queryFn: () => templatesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      templatesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({
        queryKey: queryKeys.template(variables.id),
      });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });
};

export const useUploadTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: templatesApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      toast({
        title: "Success",
        description: "Template uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload template",
        variant: "destructive",
      });
    },
  });
};

// Submissions hooks
export const useSubmissions = () => {
  return useQuery({
    queryKey: queryKeys.submissions,
    queryFn: submissionsApi.getAll,
  });
};

export const useUserSubmissions = () => {
  return useQuery({
    queryKey: queryKeys.userSubmissions,
    queryFn: submissionsApi.getUserSubmissions,
  });
};

export const useSubmission = (id: string | number) => {
  return useQuery({
    queryKey: queryKeys.submission(id),
    queryFn: () => submissionsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: submissionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubmissions });
      toast({
        title: "Success",
        description: "Submission created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create submission",
        variant: "destructive",
      });
    },
  });
};

export const useUploadSubmission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: submissionsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubmissions });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });
};

export const useValidateSubmission = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: submissionsApi.validate,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Validation completed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Validation failed",
        variant: "destructive",
      });
    },
  });
};

// Validation hooks
export const useValidationRules = () => {
  return useQuery({
    queryKey: queryKeys.validationRules,
    queryFn: validationApi.getRules,
  });
};

export const useUpdateValidationRules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: validationApi.updateRules,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.validationRules });
      toast({
        title: "Success",
        description: "Validation rules updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update validation rules",
        variant: "destructive",
      });
    },
  });
};

// Admin hooks
export const useAdminUsers = () => {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: adminApi.getUsers,
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: adminApi.getStats,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });
};
