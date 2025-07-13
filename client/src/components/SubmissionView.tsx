import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, RefreshCw, Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";

export default function SubmissionView() {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  interface Submission {
    id: number;
    templateId: number;
    userId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    reportingPeriod: string;
    status: string;
    validationErrors?: number;
    validationWarnings?: number;
    createdAt: string;
    validatedAt?: string;
    adminComments?: string;
  }

  const { data: submission, isLoading } = useQuery<Submission>({
    queryKey: ["/api/submissions/" + submissionId],
  });

  const reSubmitMutation = useMutation({
    mutationFn: async () => {
      // apiRequest expects (method, url, data?)
      return apiRequest("POST", `/api/submissions/${submissionId}/resubmit`);
    },
    onSuccess: () => {
      toast({
        title: "Re-submitted",
        description: "Submission re-submitted successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/submissions/" + submissionId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to re-submit.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!submission) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Submission Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Submission not found.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submission Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">File:</span> {submission.fileName}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  `/api/submissions/${submission.id}/download`,
                  "_blank"
                )
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-semibold">Status:</span>
            <Badge>{submission.status}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["/api/submissions/" + submissionId],
                })
              }
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          <div className="mt-2">
            <span className="font-semibold">Reporting Period:</span>{" "}
            {submission.reportingPeriod}
          </div>
          <div className="mt-2">
            <span className="font-semibold">Submitted At:</span>{" "}
            {format(new Date(submission.createdAt), "MMM dd, yyyy HH:mm")}
          </div>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Admin Comments:</span>
          <div className="bg-gray-50 border rounded p-2 mt-1 min-h-[40px]">
            {submission.adminComments || (
              <span className="text-gray-400">No comments yet.</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            size="sm"
            onClick={() => reSubmitMutation.mutate()}
            disabled={reSubmitMutation.isPending}
          >
            <Send className="h-4 w-4 mr-1" /> Re-Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
