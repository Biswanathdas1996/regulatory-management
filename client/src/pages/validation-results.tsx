import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
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
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { CommentSection } from "@/components/CommentSection";

export default function ValidationResultsPage() {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id || "0");

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

  const handleAction = async (action: string) => {
    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedback: "What the hell you submitted?" }),
        }
      );
      if (!response.ok) throw new Error("Action failed");
      alert(`Submission ${action} successfully.`);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to perform action. Please try again.");
    }
  };

  if (submissionLoading || resultsLoading) {
    return (
      <AdminLayout
        title="Validation Results"
        subtitle="Detailed validation for this submission"
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
      </AdminLayout>
    );
  }

  if (!submission || !results) {
    return (
      <AdminLayout
        title="Validation Results"
        subtitle="Detailed validation for this submission"
      >
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Alert>
                <AlertDescription>
                  Submission or results not found.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </AdminLayout>
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
      <AdminLayout
        title="Validation Results"
        subtitle="Detailed validation for this submission"
      >
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <Link to="/user-submission">
                      <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Submissions
                      </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                      {submission.status === "passed" ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      <h1 className="text-3xl font-bold text-gray-900">
                        Validation Results
                      </h1>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    Results for {submission.fileName} •{" "}
                    {submission.reportingPeriod}
                  </p>
                </div>
                <div className="flex items-center gap-4">
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

              {/* Summary Cards */}
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

              {/* Overall Status */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Overall Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        submission.status === "passed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {submission.status === "passed"
                        ? "VALIDATION PASSED"
                        : "VALIDATION FAILED"}
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
                    <p className="mt-2 text-green-700">
                      All validation rules passed successfully.{" "}
                      {warningCount > 0 &&
                        `${warningCount} warnings found but do not prevent acceptance.`}
                    </p>
                  ) : (
                    <p className="mt-2 text-red-700">
                      {errorCount} validation errors found. Please review and
                      correct the issues before resubmitting.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Admin Actions and Status Display */}
              <div className="flex items-center gap-4 mb-8">
                <>
                  <Button
                    variant="default"
                    onClick={() => handleAction("approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction("reject")}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction("return")}
                  >
                    Return to User
                  </Button>
                </>
                {!submission.isAdmin && (
                  <Badge
                    className={
                      submission.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : submission.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {submission.status.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* Detailed Results by Rule */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Validation Results</CardTitle>
                  <p className="text-sm text-gray-600">
                    {ruleGroups.length} validation rules applied •{" "}
                    {failedChecks} violations found
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
                              <strong>Condition:</strong> {group.condition}
                            </p>
                            <p className="text-sm">
                              <strong>Message:</strong> {group.errorMessage}
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
                                Failed Checks (showing first 10):
                              </h4>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Cell</TableHead>
                                      <TableHead>Value</TableHead>
                                      <TableHead>Issue</TableHead>
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
                                  failed checks
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

              {/* Comments Section */}
              <div className="mt-8">
                <CommentSection submissionId={submissionId} />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
