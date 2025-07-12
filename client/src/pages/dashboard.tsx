import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { UserSubmission } from "@/components/UserSubmission";

export default function UserDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("submissions");

  // Fetch user submissions
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError } = useQuery({
    queryKey: ["/api/user/submissions"],
    meta: {
      errorMessage: "Failed to fetch submissions"
    }
  });

  // Fetch templates for submission
  const { data: templates = [], error: templatesError } = useQuery({
    queryKey: ["/api/templates/with-rules"],
    meta: {
      errorMessage: "Failed to fetch templates"
    }
  });

  // Fetch user stats
  const { data: stats, error: statsError } = useQuery({
    queryKey: ["/api/user/stats"],
    meta: {
      errorMessage: "Failed to fetch stats"
    }
  });

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    const statusConfig = {
      pending: { icon: Clock, color: "bg-gray-500" },
      validating: { icon: RefreshCw, color: "bg-blue-500" },
      validated: { icon: CheckCircle, color: "bg-blue-500" },
      approved: { icon: CheckCircle, color: "bg-green-500" },
      rejected: { icon: XCircle, color: "bg-red-500" },
      reassigned: { icon: RefreshCw, color: "bg-yellow-500" },
    };

    // Use approval status if available, otherwise use submission status
    const displayStatus = approvalStatus || status;
    const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {displayStatus}
      </Badge>
    );
  };

  const getValidationBadge = (errors: number, warnings: number) => {
    if (errors > 0) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {errors} errors
        </Badge>
      );
    } else if (warnings > 0) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          {warnings} warnings
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <Button variant="outline" onClick={() => navigate("/templates")}>
                Browse Templates
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSubmissions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingReview || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requires Action</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.requiresAction || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="new-submission">New Submission</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
                <CardDescription>Track your submission history and status</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="text-center py-8">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No submissions yet. Click on "New Submission" to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Reporting Period</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission: any) => (
                        <TableRow key={submission.id}>
                          <TableCell>#{submission.id}</TableCell>
                          <TableCell>{submission.templateName}</TableCell>
                          <TableCell>{submission.reportingPeriod}</TableCell>
                          <TableCell>v{submission.version}</TableCell>
                          <TableCell>
                            {getStatusBadge(submission.status, submission.approvalStatus)}
                          </TableCell>
                          <TableCell>
                            {submission.status === "validated" && 
                              getValidationBadge(submission.validationErrors, submission.validationWarnings)
                            }
                          </TableCell>
                          <TableCell>{format(new Date(submission.submittedAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/submission/${submission.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(submission.approvalStatus === "rejected" || submission.approvalStatus === "reassigned") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    // Pre-fill the form with the template and reporting period
                                    setActiveTab("new-submission");
                                  }}
                                >
                                  Resubmit
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Comments Section for Rejected/Reassigned Submissions */}
            {submissions.some((s: any) => s.approvalComments) && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Admin Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions
                    .filter((s: any) => s.approvalComments)
                    .map((submission: any) => (
                      <div key={submission.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">
                            Submission #{submission.id} - {submission.templateName}
                          </span>
                          {getStatusBadge(submission.status, submission.approvalStatus)}
                        </div>
                        <p className="text-sm text-gray-600">{submission.approvalComments}</p>
                        {submission.approvedBy && (
                          <p className="text-xs text-gray-500 mt-2">
                            By Admin on {format(new Date(submission.approvedAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="new-submission" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit New Report</CardTitle>
                <CardDescription>
                  Select a template and upload your filled report for validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserSubmission />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}