import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface SubmissionHistoryProps {
  userId?: number;
  templateId?: number;
  showAllSubmissions?: boolean;
}

export function SubmissionHistory({ userId, templateId, showAllSubmissions = false }: SubmissionHistoryProps) {
  const { data: submissions, isLoading } = useQuery({
    queryKey: showAllSubmissions ? ["/api/admin/submissions"] : ["/api/submissions", { userId, templateId }],
    refetchInterval: 5000, // Refresh every 5 seconds to show status updates
  });

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
                          onClick={() => window.open(`/api/submissions/${submission.id}/results`, '_blank')}
                          disabled={submission.status === "validating"}
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