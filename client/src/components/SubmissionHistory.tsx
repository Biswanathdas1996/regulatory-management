import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, CheckCircle, XCircle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SubmissionHistoryProps {
  userId?: number;
  templateId?: number;
  showAllSubmissions?: boolean;
}

export function SubmissionHistory({ userId, templateId, showAllSubmissions = false }: SubmissionHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: submissions, isLoading } = useQuery({
    queryKey: showAllSubmissions ? ["/api/admin/submissions"] : ["/api/submissions", userId, templateId],
    queryFn: async () => {
      if (showAllSubmissions) {
        const response = await fetch("/api/admin/submissions");
        return response.json();
      } else {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId.toString());
        if (templateId) params.append('templateId', templateId.toString());
        const response = await fetch(`/api/submissions?${params}`);
        return response.json();
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds to show status updates
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: number) => {
      return apiRequest(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
      // Invalidate and refetch submissions
      queryClient.invalidateQueries({ 
        queryKey: showAllSubmissions ? ["/api/admin/submissions"] : ["/api/submissions", userId, templateId] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete submission",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSubmission = (submissionId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      deleteSubmissionMutation.mutate(submissionId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "validating":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "validating":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {showAllSubmissions ? "All Submissions" : "Submission History"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Reporting Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission: any) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.fileName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {submission.templateId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {submission.reportingPeriod}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.status)}
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.status === "passed" && (
                        <div className="text-sm text-green-600">
                          {submission.validationWarnings || 0} warnings
                        </div>
                      )}
                      {submission.status === "failed" && (
                        <div className="text-sm text-red-600">
                          {submission.validationErrors || 0} errors, {submission.validationWarnings || 0} warnings
                        </div>
                      )}
                      {submission.status === "validating" && (
                        <div className="text-sm text-yellow-600">
                          Validating...
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatFileSize(submission.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Navigate to validation results view
                            if (submission.status === "passed" || submission.status === "failed") {
                              window.location.href = `/validation-results/${submission.id}`;
                            }
                          }}
                          disabled={submission.status === "validating" || submission.status === "pending"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/submissions/${submission.id}/download`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubmission(submission.id, submission.fileName)}
                          disabled={deleteSubmissionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}