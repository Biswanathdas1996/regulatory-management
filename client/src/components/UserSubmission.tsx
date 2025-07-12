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
import { CloudUpload, Upload, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
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
  ruleId: number;
  ruleType: string;
  field: string;
  condition: string;
  result: string;
  message: string;
  severity: string;
  createdAt: string;
  value?: string;
  errorMessage?: string;
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
    
    // Get unique rule IDs to count actual rules used
    const uniqueRuleIds = new Set(validationResults.map(r => r.ruleId));
    const totalRules = uniqueRuleIds.size;
    
    return { errors, warnings, passed, total: validationResults.length, totalRules };
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

              {/* Template Download Link */}
              {form.watch("templateId") && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Download Template</h4>
                      <p className="text-sm text-blue-700">
                        Download the selected template file to fill it out before submitting
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const templateId = form.watch("templateId");
                        if (templateId) {
                          window.open(`/api/templates/${templateId}/download`, '_blank');
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              )}

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



      {/* Enhanced Validation Results */}
      {validationResults.length > 0 && (
        <Card className="border-2 shadow-lg">
          <CardHeader className={`${
            stats.errors > 0 ? "bg-red-50 border-b border-red-200" : 
            stats.warnings > 0 ? "bg-yellow-50 border-b border-yellow-200" : 
            "bg-green-50 border-b border-green-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Detailed Validation Report
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Submission ID: #{submissionId}
                </p>
              </div>
              <div className={`text-3xl font-bold ${
                stats.errors > 0 ? "text-red-600" : 
                stats.warnings > 0 ? "text-yellow-600" : 
                "text-green-600"
              }`}>
                {stats.errors === 0 && stats.warnings === 0 ? "✓ PASSED" : 
                 stats.errors > 0 ? "✗ FAILED" : "⚠ WARNING"}
              </div>
            </div>
            
            {/* Summary Badges */}
            <div className="space-y-3 mt-4">
              {/* Rules and Checks Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{stats.totalRules} validation rules</span> were applied, 
                  resulting in <span className="font-semibold">{stats.total} individual cell/field checks</span>
                </p>
              </div>
              
              {/* Result Badges */}
              <div className="flex flex-wrap gap-3">
                <Badge variant={stats.errors > 0 ? "destructive" : "outline"} className="px-4 py-2 text-base">
                  <XCircle className="w-5 h-5 mr-2" />
                  {stats.errors} Failed Checks (Errors)
                </Badge>
                <Badge variant={stats.warnings > 0 ? "secondary" : "outline"} className="px-4 py-2 text-base">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {stats.warnings} Failed Checks (Warnings)
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-base border-green-500 text-green-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {stats.passed} Passed Checks
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {stats.errors === 0 && stats.warnings === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-700 mb-2">Perfect Submission!</h3>
                <p className="text-gray-600">
                  All {stats.total} validation checks passed successfully. Your data meets all requirements.
                </p>
              </div>
            ) : (
              <div>
                {/* Violations by Type */}
                <div className="p-6">
                  {/* Critical Errors Section */}
                  {stats.errors > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center">
                        <XCircle className="w-6 h-6 mr-2" />
                        Critical Errors ({stats.errors}) - Must be fixed
                      </h3>
                      <div className="grid gap-4">
                        {validationResults
                          .filter(r => r.result === 'failed' && r.severity === 'error')
                          .map((result) => (
                            <div key={result.id} className="bg-red-50 border-2 border-red-300 rounded-lg p-5 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono text-base bg-red-200 px-3 py-1 rounded-md text-red-800 font-bold">
                                      {result.field}
                                    </span>
                                    <Badge variant="destructive" className="text-sm">
                                      {result.ruleType.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-red-800 font-semibold text-lg mb-3">
                                    {result.errorMessage || result.message}
                                  </p>
                                  
                                  <div className="bg-white p-3 rounded-md border border-red-200 space-y-2">
                                    {result.value !== undefined && (
                                      <div className="flex items-start">
                                        <span className="font-medium text-gray-700 min-w-[120px]">Current Value:</span>
                                        <code className="bg-red-100 px-2 py-1 rounded text-red-700 font-mono text-sm">
                                          {result.value === '' ? '<empty>' : result.value || '<null>'}
                                        </code>
                                      </div>
                                    )}
                                    <div className="flex items-start">
                                      <span className="font-medium text-gray-700 min-w-[120px]">Expected:</span>
                                      <span className="text-gray-800">{result.condition}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings Section */}
                  {stats.warnings > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-yellow-700 mb-4 flex items-center">
                        <AlertCircle className="w-6 h-6 mr-2" />
                        Warnings ({stats.warnings}) - Should be reviewed
                      </h3>
                      <div className="grid gap-4">
                        {validationResults
                          .filter(r => r.result === 'failed' && r.severity === 'warning')
                          .map((result) => (
                            <div key={result.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono text-base bg-yellow-200 px-3 py-1 rounded-md text-yellow-800 font-bold">
                                      {result.field}
                                    </span>
                                    <Badge variant="secondary" className="text-sm">
                                      {result.ruleType.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-yellow-800 font-semibold text-lg mb-3">
                                    {result.errorMessage || result.message}
                                  </p>
                                  
                                  <div className="bg-white p-3 rounded-md border border-yellow-200 space-y-2">
                                    {result.value !== undefined && (
                                      <div className="flex items-start">
                                        <span className="font-medium text-gray-700 min-w-[120px]">Current Value:</span>
                                        <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-700 font-mono text-sm">
                                          {result.value === '' ? '<empty>' : result.value || '<null>'}
                                        </code>
                                      </div>
                                    )}
                                    <div className="flex items-start">
                                      <span className="font-medium text-gray-700 min-w-[120px]">Expected:</span>
                                      <span className="text-gray-800">{result.condition}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Actions */}
                  <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Next Steps:</h4>
                    <ul className="space-y-1 text-gray-700">
                      {stats.errors > 0 && (
                        <li className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          Fix all critical errors before resubmitting
                        </li>
                      )}
                      {stats.warnings > 0 && (
                        <li className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          Review warnings to ensure data accuracy
                        </li>
                      )}
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        Download the template again if needed
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}