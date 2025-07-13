import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  Upload,
  CloudUpload,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import UserLayout from "@/components/UserLayout";
import { CommentSection } from "@/components/CommentSection";
import { useToast } from "@/hooks/use-toast";

export default function SubmissionViewPage() {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for file re-upload functionality
  const [reuploadDialogOpen, setReuploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationPhase, setValidationPhase] = useState<'idle' | 'uploading' | 'validating' | 'complete'>('idle');

  const { data: submission, isLoading: submissionLoading } = useQuery({
    queryKey: [`/api/submissions/${submissionId}`],
    queryFn: async () => {
      const response = await fetch(`/api/submissions/${submissionId}`);
      if (!response.ok) throw new Error("Failed to fetch submission");
      return response.json();
    },
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: [`/api/submissions/${submissionId}/results`],
    queryFn: async () => {
      const response = await fetch(`/api/submissions/${submissionId}/results`);
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
  });

  // Re-upload mutation
  const reuploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setValidationPhase('uploading');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateId", submission.templateId.toString());
      formData.append("reportingPeriod", submission.reportingPeriod);

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

      const response = await fetch(`/api/submissions/${submissionId}/reupload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(uploadInterval);
      setUploadProgress(100);
      setValidationPhase('validating');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Re-upload failed");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: "File re-uploaded successfully. Validation in progress...",
      });
      
      // Simulate validation time and then refresh data
      setTimeout(async () => {
        setValidationPhase('complete');
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/submissions/${submissionId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/submissions/${submissionId}/results`] });
        setReuploadDialogOpen(false);
        setSelectedFile(null);
        setValidationPhase('idle');
        setUploadProgress(0);
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to re-upload file",
        variant: "destructive",
      });
      setValidationPhase('idle');
      setUploadProgress(0);
    }
  });

  // File handling functions
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleReupload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    reuploadMutation.mutate(selectedFile);
  };

  if (submissionLoading || resultsLoading) {
    return (
      <UserLayout
        title="Submission Details"
        subtitle="View your submission and validation results"
      >
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!submission) {
    return (
      <UserLayout
        title="Submission Details"
        subtitle="View your submission and validation results"
      >
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Alert>
                <AlertDescription>Submission not found.</AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  // Group results by rule for better visualization
  const groupedResults = Array.isArray(results)
    ? results.reduce((acc: any, result: any) => {
        const key = `${result.ruleId}-${result.ruleType}-${result.field}`;
        if (!acc[key]) {
          acc[key] = {
            ruleId: result.ruleId,
            ruleType: result.ruleType,
            field: result.field,
            condition: result.condition,
            errorMessage: result.errorMessage,
            severity: result.severity,
            results: [],
          };
        }
        acc[key].results.push(result);
        return acc;
      }, {})
    : [];

  const ruleGroups = Array.isArray(results)
    ? Object.values(groupedResults)
    : [];
  const totalChecks = Array.isArray(results) ? results.length : 0;
  const passedChecks = Array.isArray(results)
    ? results.filter((r: any) => r.passed).length
    : 0;
  const failedChecks = totalChecks - passedChecks;
  const errorCount = Array.isArray(results)
    ? results.filter((r: any) => !r.passed && r.severity === "error").length
    : 0;
  const warningCount = Array.isArray(results)
    ? results.filter((r: any) => !r.passed && r.severity === "warning").length
    : 0;

  return (
    <>
    <UserLayout
      title="Submission Details"
      subtitle="View your submission and validation results"
    >
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Link to="/submission-history">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to History
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2">
                    {submission.status === "passed" ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : submission.status === "failed" ? (
                      <XCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <RefreshCw className="h-6 w-6 text-blue-500" />
                    )}
                    <h1 className="text-3xl font-bold text-gray-900">
                      My Submission
                    </h1>
                  </div>
                </div>
                <p className="text-gray-600">
                  {submission.fileName} • {submission.reportingPeriod}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {submission.status === "returned" && (
                  <Button
                    variant="default"
                    onClick={() => setReuploadDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Re-upload File
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `/api/submissions/${submissionId}/download`,
                      "_blank"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>

            {/* Summary Cards - Only show if results are available */}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{totalChecks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Passed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-green-600">
                      {passedChecks}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-red-600">
                      {errorCount}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-yellow-600">
                      {warningCount}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Submission Status */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submission Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        submission.status === "passed"
                          ? "bg-green-100 text-green-800"
                          : submission.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }
                    >
                      {submission.status === "passed"
                        ? "VALIDATION PASSED"
                        : submission.status === "failed"
                        ? "VALIDATION FAILED"
                        : submission.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Submitted on{" "}
                      {format(
                        new Date(submission.createdAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </span>
                  </div>

                  {submission.status === "passed" ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 font-medium">
                        ✅ Congratulations! Your submission has passed all
                        validation checks.
                      </p>
                      {warningCount > 0 && (
                        <p className="text-yellow-700 mt-2">
                          ⚠️ {warningCount} warnings found, but they do not
                          prevent acceptance.
                        </p>
                      )}
                    </div>
                  ) : submission.status === "failed" ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-medium">
                        ❌ Your submission has validation errors that need to be
                        fixed.
                      </p>
                      <p className="text-red-600 mt-2">
                        {errorCount} errors found. Please review the details
                        below and correct the issues before resubmitting.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 font-medium">
                        🔄 Your submission is being processed.
                      </p>
                      <p className="text-blue-600 mt-2">
                        Please wait while we validate your submission.
                      </p>
                    </div>
                  )}

                  {/* Admin Comments */}
                  {submission.adminComments && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Admin Comments:
                      </h4>
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        <p className="text-gray-700">
                          {submission.adminComments}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results - Only show if validation results are available */}
            {results && ruleGroups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Details</CardTitle>
                  <p className="text-sm text-gray-600">
                    {ruleGroups.length} validation rules applied •{" "}
                    {failedChecks} issues found
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {ruleGroups.map((group: any, index: number) => {
                      const failedResults = group.results.filter(
                        (r: any) => !r.passed
                      );
                      const passedResults = group.results.filter(
                        (r: any) => r.passed
                      );
                      const hasFailures = failedResults.length > 0;

                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {hasFailures ? (
                                group.severity === "error" ? (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                )
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                              <h3 className="font-medium">
                                Rule {group.ruleId}:{" "}
                                {group.ruleType
                                  ? group.ruleType.toUpperCase()
                                  : "UNKNOWN"}{" "}
                                validation
                              </h3>
                            </div>
                            <Badge
                              variant={
                                hasFailures
                                  ? group.severity === "error"
                                    ? "destructive"
                                    : "secondary"
                                  : "outline"
                              }
                            >
                              {hasFailures
                                ? `${failedResults.length} failed`
                                : "All passed"}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-3">
                            <p className="text-sm">
                              <strong>Field:</strong> {group.field}
                            </p>
                            <p className="text-sm">
                              <strong>What this checks:</strong>{" "}
                              {group.condition}
                            </p>
                            <p className="text-sm">
                              <strong>Results:</strong> {passedResults.length}{" "}
                              passed, {failedResults.length} failed out of{" "}
                              {group.results.length} total checks
                            </p>
                          </div>

                          {hasFailures && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2 text-red-700">
                                Issues Found (showing first 10):
                              </h4>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Cell Location</TableHead>
                                      <TableHead>Current Value</TableHead>
                                      <TableHead>Issue Description</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {failedResults
                                      .slice(0, 10)
                                      .map(
                                        (result: any, resultIndex: number) => (
                                          <TableRow key={resultIndex}>
                                            <TableCell className="font-mono text-sm">
                                              {result.cellReference}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                              {result.actualValue || "(empty)"}
                                            </TableCell>
                                            <TableCell className="text-sm text-red-600">
                                              {result.errorMessage}
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )}
                                  </TableBody>
                                </Table>
                              </div>
                              {failedResults.length > 10 && (
                                <p className="text-sm text-gray-500 mt-2">
                                  ... and {failedResults.length - 10} more
                                  issues
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {submission.status === "failed" && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      To resolve the validation errors:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        Download your original file using the "Download File"
                        button above
                      </li>
                      <li>
                        Review the validation details and fix the identified
                        issues
                      </li>
                      <li>Save your corrected file</li>
                      <li>Submit the corrected file as a new submission</li>
                    </ol>
                    <div className="mt-4">
                      <Link to="/user-submission">
                        <Button>Submit New File</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <div className="mt-8">
              <CommentSection submissionId={submissionId} />
            </div>
          </div>
        </div>
      </div>
    </UserLayout>

    {/* Re-upload Modal */}
    <Dialog open={reuploadDialogOpen} onOpenChange={setReuploadDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Re-upload Corrected File</DialogTitle>
          <DialogDescription>
            Upload your corrected file to address the issues identified in the previous submission.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
              isDragging ? "border-primary bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-4">
              <CloudUpload className="mx-auto h-10 w-10 text-gray-400" />
            </div>
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-900">Drop your corrected file here</p>
              <p className="text-sm text-gray-500 mt-1">Supports Excel (.xlsx) and CSV files</p>
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("reupload-file-input")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <input
                id="reupload-file-input"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {reuploadMutation.isPending && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {validationPhase === 'uploading' && 'Uploading file...'}
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
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setReuploadDialogOpen(false);
              setSelectedFile(null);
            }}
            disabled={reuploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReupload}
            disabled={!selectedFile || reuploadMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {reuploadMutation.isPending ? (
              <>
                {validationPhase === 'uploading' && 'Uploading...'}
                {validationPhase === 'validating' && 'Validating...'}
                {validationPhase === 'complete' && 'Complete!'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Re-upload File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
