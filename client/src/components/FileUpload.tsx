import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CloudUpload, FolderOpen, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const uploadSchema = z.object({
  templateType: z.string().min(1, "Template type is required"),
  templateName: z.string().min(1, "Template name is required"),
  templateFile: z.instanceof(FileList).refine((files) => files.length > 0, "Template file is required"),
  validationRulesFile: z.instanceof(FileList).optional()
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface FileUploadProps {
  onTemplateUploaded: (templateId: number) => void;
}

export function FileUpload({ onTemplateUploaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing' | 'complete'>('idle');
  const { toast } = useToast();

  const { data: templateTypes } = useQuery({
    queryKey: ["/api/template-types"],
  });

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      templateType: "",
      templateName: "",
      templateFile: undefined,
      validationRulesFile: undefined
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      setUploadPhase('uploading');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("template", data.templateFile[0]);
      if (data.validationRulesFile && data.validationRulesFile.length > 0) {
        formData.append("validationRules", data.validationRulesFile[0]);
      }
      formData.append("templateType", data.templateType);
      formData.append("templateName", data.templateName);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
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
      setUploadPhase('processing');
      
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
      setUploadPhase('complete');
      
      // Reset phase after a short delay
      setTimeout(() => {
        setUploadPhase('idle');
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
      setUploadPhase('idle');
    }
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

  const handleValidationFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      form.setValue("validationRulesFile", files);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    setUploadProgress(10);
    uploadMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Upload Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="templateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templateTypes?.map((type: any) => (
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
                <p className="text-lg font-medium text-gray-900">Drop files here or click to browse</p>
                <p className="text-sm text-gray-500 mt-1">Supports Excel (.xlsx) and CSV files up to 100MB</p>
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
                          onClick={() => document.getElementById("template-file-input")?.click()}
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
              {form.watch("templateFile") && form.watch("templateFile").length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Template: {form.watch("templateFile")[0].name}
                </p>
              )}
            </div>

            {/* Validation Rules Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <div className="mb-4">
                <p className="text-lg font-medium text-gray-900">Validation Rules (Optional)</p>
                <p className="text-sm text-gray-500 mt-1">Upload a .txt file with validation rules</p>
                <div className="mt-2">
                  <a
                    href="/sample-validation-rules.txt"
                    download="sample-validation-rules.txt"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download sample validation rules file
                  </a>
                </div>
              </div>
              <FormField
                control={form.control}
                name="validationRulesFile"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("validation-file-input")?.click()}
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Choose Validation Rules
                        </Button>
                        <input
                          id="validation-file-input"
                          type="file"
                          accept=".txt"
                          onChange={handleValidationFileSelect}
                          className="hidden"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("validationRulesFile") && form.watch("validationRulesFile").length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Rules: {form.watch("validationRulesFile")[0].name}
                </p>
              )}
            </div>

            {/* Upload Progress */}
            {uploadMutation.isPending && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {uploadPhase === 'uploading' && 'Uploading files...'}
                    {uploadPhase === 'processing' && 'Processing template...'}
                    {uploadPhase === 'complete' && 'Upload complete!'}
                  </span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                
                {/* Phase indicators */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className={`flex items-center ${uploadPhase === 'uploading' ? 'text-blue-600' : uploadProgress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${uploadPhase === 'uploading' ? 'bg-blue-600' : uploadProgress >= 100 ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Upload
                  </div>
                  <div className={`flex items-center ${uploadPhase === 'processing' ? 'text-blue-600' : uploadPhase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${uploadPhase === 'processing' ? 'bg-blue-600' : uploadPhase === 'complete' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    Process
                  </div>
                  <div className={`flex items-center ${uploadPhase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${uploadPhase === 'complete' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
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
              <Button
                type="submit"
                disabled={uploadMutation.isPending}
              >
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
