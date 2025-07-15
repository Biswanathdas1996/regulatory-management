import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Download,
  Eye,
  User,
  XCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Submission {
  id: number;
  templateId: number;
  userId: number;
  userName: string;
  fileName: string;
  fileSize: number;
  reportingPeriod: string;
  status: string;
  validationWarnings: number;
  createdAt: string;
}

export default function AdminSubmissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"reject" | "return">("reject");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [reason, setReason] = useState("");
  // Get user context to display user categories
  const { user } = useAuth(); // Assuming you have an auth context
  const userCategories = user?.category;
  console.log("Dialog state:", {
    actionDialogOpen,
    selectedSubmission,
    actionType,
  }); // Debug log

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: [`/api/admin/submissions?category=${userCategories}`],
  });

  // Mutation for submission actions
  const actionMutation = useMutation({
    mutationFn: async ({
      submissionId,
      actionType,
      reason,
    }: {
      submissionId: number;
      actionType: "reject" | "return";
      reason: string;
    }) => {
      const response = await fetch(
        `/api/submissions/${submissionId}/${actionType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            actionType === "reject" ? { reason } : { feedback: reason }
          ),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${actionType} submission`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Submission ${
          variables.actionType === "reject" ? "rejected" : "returned"
        } successfully`,
      });

      // Close dialog and reset state
      setActionDialogOpen(false);
      setReason("");
      setSelectedSubmission(null);

      // Refresh submissions list
      queryClient.invalidateQueries({ queryKey: [`/api/admin/submissions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform action",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleActionClick = (
    submission: Submission,
    action: "reject" | "return"
  ) => {
    console.log("Action clicked:", action, submission.id); // Debug log
    setSelectedSubmission(submission);
    setActionType(action);
    setActionDialogOpen(true);
    console.log("Dialog should open now"); // Debug log
  };

  const handleSubmitAction = () => {
    if (!selectedSubmission || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason",
        variant: "destructive",
      });
      return;
    }

    actionMutation.mutate({
      submissionId: selectedSubmission.id,
      actionType,
      reason: reason.trim(),
    });
  };

  return (
    <AdminLayout
      title="Submission Management"
      subtitle="View and manage all user submissions"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            All Submissions ({submissions.length})
          </CardTitle>
          <div className="text-sm text-gray-600 mt-1">
            User Categories: {userCategories}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading submissions...</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No submissions found
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
                          <span className="font-medium">
                            {submission.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {submission.fileName}
                      </TableCell>
                      <TableCell>{submission.reportingPeriod}</TableCell>
                      <TableCell>
                        <Badge
                          className={`
                          ${
                            submission.status === "passed"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : submission.status === "failed"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : submission.status === "pending"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : submission.status === "rejected"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : submission.status === "returned"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : submission.status === "approved"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        `}
                        >
                          {submission.status === "passed" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "failed" && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "pending" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "rejected" && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "returned" && (
                            <ArrowLeft className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "approved" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status.charAt(0).toUpperCase() +
                            submission.status.slice(1)}
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
                        {format(
                          new Date(submission.createdAt),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/validation-results/${submission.id}`;
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `/api/submissions/${submission.id}/download`,
                                "_blank"
                              )
                            }
                            title="Download File"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {(submission.status === "passed" ||
                            submission.status === "failed") && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleActionClick(submission, "return")
                                }
                                className="text-yellow-600 hover:text-yellow-700"
                                title="Return to User"
                                disabled={actionMutation.isPending}
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleActionClick(submission, "reject")
                                }
                                className="text-red-600 hover:text-red-700"
                                title="Reject Submission"
                                disabled={actionMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange:", open); // Debug log
          setActionDialogOpen(open);
          if (!open) {
            setReason("");
            setSelectedSubmission(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "reject" ? "Reject" : "Return"} Submission
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedSubmission.fileName}
                  </p>
                  <p className="text-xs text-gray-600">
                    Submitted by {selectedSubmission.userName}
                  </p>
                </div>
              )}
              <p className="mt-3">
                {actionType === "reject"
                  ? "Provide a reason for rejecting this submission. The user will be notified with this feedback."
                  : "Provide feedback for returning this submission to the user for revision."}
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                {actionType === "reject" ? "Rejection Reason" : "Feedback"} *
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  actionType === "reject"
                    ? "e.g., Data validation errors in column C, incorrect formatting..."
                    : "e.g., Please review the quarterly figures and resubmit..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              {reason.trim().length === 0 && (
                <p className="text-xs text-red-600">
                  Please provide a reason before proceeding.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setReason("");
              }}
              disabled={actionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={handleSubmitAction}
              disabled={actionMutation.isPending || !reason.trim()}
            >
              {actionMutation.isPending
                ? "Processing..."
                : actionType === "reject"
                ? "Reject"
                : "Return"}{" "}
              Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
