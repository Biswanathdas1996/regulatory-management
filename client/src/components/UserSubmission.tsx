import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const submissionSchema = z.object({
  templateId: z.string().min(1, "Please select a template"),
  reportingPeriod: z.string().min(1, "Please select a reporting period"),
  file: z.instanceof(FileList).refine((files) => files.length > 0, "File is required")
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface ValidationResult {
  id: number;
  ruleType: string;
  field: string;
  condition: string;
  result: string;
  message: string;
  severity: string;
  createdAt: string;
}

export function UserSubmission() {
  const [isDragging, setIsDragging] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationPhase, setValidationPhase] = useState<'idle' | 'uploading' | 'validating' | 'complete'>('idle');
  const { toast } = useToast();

  const { data: templates } = useQuery({
    queryKey: ["/api/templates/with-rules"],
  });

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      templateId: "",
      reportingPeriod: "",
      file: undefined
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      setValidationPhase('uploading');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", data.file[0]);
      formData.append("templateId", data.templateId);
      formData.append("reportingPeriod", data.reportingPeriod);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 80) {
            clearInterval(uploadInterval);
            return 80;
          }
          return prev + 20;
        });
      }, 300);

      const response = await fetch("/api/submissions/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(uploadInterval);
      setUploadProgress(100);
      setValidationPhase('validating');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      setSubmissionId(data.submissionId);
      toast({
        title: "Success",
        description: "File uploaded successfully. Validation in progress...",
      });
      
      // Simulate validation time and fetch results
      setTimeout(async () => {
        const resultsResponse = await fetch(`/api/submissions/${data.submissionId}/results`);
        if (resultsResponse.ok) {
          const results = await resultsResponse.json();
          setValidationResults(results);
          setValidationPhase('complete');
        }
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setValidationPhase('idle');
      setUploadProgress(0);
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
      form.setValue("file", fileList.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      form.setValue("file", files);
    }
  };

  const onSubmit = (data: SubmissionFormData) => {
    uploadMutation.mutate(data);
  };

  const getValidationStats = () => {
    const errors = validationResults.filter(r => r.severity === 'error' && r.result === 'failed').length;
    const warnings = validationResults.filter(r => r.severity === 'warning' && r.result === 'failed').length;
    const passed = validationResults.filter(r => r.result === 'passed').length;
    return { errors, warnings, passed, total: validationResults.length };
  };

  const stats = getValidationStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Filled Template</CardTitle>
          <CardDescription>
            Select from available templates with validation rules configured, then upload your filled Excel or CSV file for validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates && templates.length > 0 ? (
                          templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{template.name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {template.rulesCount} rules
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No templates with validation rules available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportingPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporting Period *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reporting period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Q1 2024">Q1 2024</SelectItem>
                        <SelectItem value="Q2 2024">Q2 2024</SelectItem>
                        <SelectItem value="Q3 2024">Q3 2024</SelectItem>
                        <SelectItem value="Q4 2024">Q4 2024</SelectItem>
                        <SelectItem value="FY 2023-24">FY 2023-24</SelectItem>
                        <SelectItem value="FY 2024-25">FY 2024-25</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  <p className="text-lg font-medium text-gray-900">Drop your filled template here</p>
                  <p className="text-sm text-gray-500 mt-1">Supports Excel (.xlsx) and CSV files</p>
                </div>
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("submission-file-input")?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>
                          <input
                            id="submission-file-input"
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
                {form.watch("file") && form.watch("file").length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {form.watch("file")[0].name}
                  </p>
                )}
              </div>

              {/* Validation Progress */}
              {uploadMutation.isPending && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {validationPhase === 'uploading' && 'Uploading submission...'}
                      {validationPhase === 'validating' && 'Validating against rules...'}
                      {validationPhase === 'complete' && 'Validation complete!'}
                    </span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  
                  {/* Phase indicators */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className={`flex items-center ${validationPhase === 'uploading' ? 'text-blue-600' : uploadProgress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${validationPhase === 'uploading' ? 'bg-blue-600' : uploadProgress >= 100 ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Upload
                    </div>
                    <div className={`flex items-center ${validationPhase === 'validating' ? 'text-blue-600' : validationPhase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${validationPhase === 'validating' ? 'bg-blue-600' : validationPhase === 'complete' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Validate
                    </div>
                    <div className={`flex items-center ${validationPhase === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${validationPhase === 'complete' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Complete
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={uploadMutation.isPending} className="w-full">
                {uploadMutation.isPending ? (
                  <>
                    {validationPhase === 'uploading' && 'Uploading...'}
                    {validationPhase === 'validating' && 'Validating...'}
                    {validationPhase === 'complete' && 'Complete!'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit for Validation
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant={stats.errors > 0 ? "destructive" : "default"}>
                {stats.errors} Errors
              </Badge>
              <Badge variant="secondary">
                {stats.warnings} Warnings
              </Badge>
              <Badge variant="outline">
                {stats.passed} Passed
              </Badge>
              <Badge>
                {stats.total} Total Checks
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {stats.errors === 0 && stats.warnings === 0 ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All validation checks passed successfully! Your submission is valid.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {validationResults
                  .filter(r => r.result === 'failed')
                  .map((result) => (
                    <Alert
                      key={result.id}
                      className={
                        result.severity === 'error' 
                          ? "border-red-200 bg-red-50" 
                          : "border-yellow-200 bg-yellow-50"
                      }
                    >
                      <div className="flex items-start">
                        {result.severity === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        )}
                        <div className="ml-3 flex-1">
                          <p className={`font-medium ${
                            result.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {result.field} - {result.ruleType}
                          </p>
                          <p className={`text-sm mt-1 ${
                            result.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                          }`}>
                            {result.message}
                          </p>
                          <p className="text-xs mt-1 text-gray-600">
                            Condition: {result.condition}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}