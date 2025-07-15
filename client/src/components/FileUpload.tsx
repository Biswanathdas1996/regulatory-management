import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CloudUpload, FolderOpen, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const uploadSchema = z.object({
  templateType: z.string().min(1, "Template type is required"),
  templateName: z.string().min(1, "Template name is required"),
  category: z.string().min(1, "Category is required"),
  frequency: z.string().min(1, "Frequency is required"),
  lastSubmissionDate: z.string().optional(),
  templateFile: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Template file is required"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface FileUploadProps {
  onTemplateUploaded: (templateId: number) => void;
}

export function FileUpload({ onTemplateUploaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<
    "idle" | "uploading" | "processing" | "complete"
  >("idle");
  const { toast } = useToast();

  const { data: templateTypes } = useQuery({
    queryKey: ["/api/template-types"],
  });
  
  // Debug logging (temporary)
  // console.log("Template types data:", templateTypes);
  // console.log("Categories data:", categoriesData);
  // console.log("Current user:", currentUser);

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch dynamic categories from the API
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  // Transform API categories to select options
  const categories = useMemo(() => {
    return categoriesData.map((cat: any) => ({
      value: cat.id.toString(), // Use category ID as value
      label: cat.displayName,
    }));
  }, [categoriesData]);

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "half_yearly", label: "Half Yearly" },
    { value: "yearly", label: "Yearly" },
  ];

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      templateType: "",
      templateName: "",
      category: "",
      frequency: "",
      lastSubmissionDate: "",
      templateFile: undefined,
    },
  });

  // Update category when user data loads
  useEffect(() => {
    if (currentUser?.role === "ifsca_user" && currentUser.category && categoriesData.length > 0) {
      // Set category as string ID
      const categoryValue = currentUser.category.toString();
      const currentCategoryValue = form.getValues("category");
      
      // Only update if different to prevent infinite loops
      if (currentCategoryValue !== categoryValue) {
        console.log("Setting category for IFSCA user:", categoryValue);
        console.log("Available categories:", categories.map(c => ({ value: c.value, label: c.label })));
        console.log("Current form category value:", currentCategoryValue);
        form.setValue("category", categoryValue);
        console.log("After setting category value:", form.getValues("category"));
      }
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.category, categoriesData.length]);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      setUploadPhase("uploading");
      setUploadProgress(0);

      console.log("FileUpload: Uploading template with data:", {
        templateType: data.templateType,
        templateName: data.templateName,
        category: data.category,
        frequency: data.frequency,
        lastSubmissionDate: data.lastSubmissionDate
      });

      const formData = new FormData();
      formData.append("template", data.templateFile[0]);
      formData.append("templateType", data.templateType);
      formData.append("templateName", data.templateName);
      formData.append("category", data.category);
      formData.append("frequency", data.frequency);
      if (data.lastSubmissionDate) {
        formData.append("lastSubmissionDate", data.lastSubmissionDate);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      setUploadProgress(100);
      setUploadPhase("processing");

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Template uploaded successfully and processing started",
      });
      onTemplateUploaded(data.templateId);
      form.reset();
      setUploadProgress(0);
      setUploadPhase("complete");

      // Reset phase after a short delay
      setTimeout(() => {
        setUploadPhase("idle");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
      setUploadPhase("idle");
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fileList = new DataTransfer();
      fileList.items.add(files[0]);
      form.setValue("templateFile", fileList.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      form.setValue("templateFile", files);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    setUploadProgress(10);
    uploadMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Upload Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="templateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(templateTypes) && templateTypes.map((type: any) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        console.log("Category select changed to:", value);
                        field.onChange(value);
                      }} 
                      value={field.value}
                      disabled={currentUser?.role === "ifsca_user"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {currentUser?.role === "ifsca_user" && (
                      <p className="text-sm text-gray-500">
                        Category is automatically set based on your role
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastSubmissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Submission Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        placeholder="Select date..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-500">
                      Used to track submission schedules
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                isDragging ? "border-primary bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-4">
                <CloudUpload className="mx-auto h-12 w-12 text-gray-400" />
              </div>
              <div className="mb-4">
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports Excel (.xlsx) and CSV files up to 100MB
                </p>
              </div>
              <FormField
                control={form.control}
                name="templateFile"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document
                              .getElementById("template-file-input")
                              ?.click()
                          }
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Choose Template File
                        </Button>
                        <input
                          id="template-file-input"
                          type="file"
                          accept=".xlsx,.csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("templateFile") &&
                form.watch("templateFile").length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Template: {form.watch("templateFile")[0].name}
                  </p>
                )}
            </div>

            {/* Upload Progress */}
            {uploadMutation.isPending && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {uploadPhase === "uploading" && "Uploading files..."}
                    {uploadPhase === "processing" && "Processing template..."}
                    {uploadPhase === "complete" && "Upload complete!"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="w-full" />

                {/* Phase indicators */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div
                    className={`flex items-center ${
                      uploadPhase === "uploading"
                        ? "text-blue-600"
                        : uploadProgress >= 100
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${
                        uploadPhase === "uploading"
                          ? "bg-blue-600"
                          : uploadProgress >= 100
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    Upload
                  </div>
                  <div
                    className={`flex items-center ${
                      uploadPhase === "processing"
                        ? "text-blue-600"
                        : uploadPhase === "complete"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${
                        uploadPhase === "processing"
                          ? "bg-blue-600"
                          : uploadPhase === "complete"
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    Process
                  </div>
                  <div
                    className={`flex items-center ${
                      uploadPhase === "complete"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${
                        uploadPhase === "complete"
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    Complete
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Process
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
