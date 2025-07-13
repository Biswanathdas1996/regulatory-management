import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Download, Eye, User } from "lucide-react";
import { format } from "date-fns";

interface SuccessfulSubmission {
  id: number;
  templateId: number;
  userId: number;
  userName: string;
  fileName: string;
  fileSize: number;
  reportingPeriod: string;
  status: string;
  validationWarnings: number;
  submittedAt: string;
}

export default function AdminSubmissionsPage() {
  const { data: submissions = [], isLoading } = useQuery<SuccessfulSubmission[]>({
    queryKey: ['/api/admin/submissions'],
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminLayout 
      title="Successful Submissions" 
      subtitle="View all successfully validated submissions with user details"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Successfully Validated Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading submissions...</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No successful submissions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Reporting Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warnings</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{submission.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {submission.fileName}
                      </TableCell>
                      <TableCell>
                        {submission.reportingPeriod}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Passed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-yellow-600">
                          {submission.validationWarnings || 0} warnings
                        </div>
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
                              window.location.href = `/validation-results/${submission.id}`;
                            }}
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
    </AdminLayout>
  );
}