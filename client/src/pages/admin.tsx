import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Users, 
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [assignToUser, setAssignToUser] = useState<string>("");

  // Redirect if not admin
  if (user?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  // Fetch all submissions
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError } = useQuery({
    queryKey: ["/api/admin/submissions"],
    meta: {
      errorMessage: "Failed to fetch submissions"
    }
  });

  // Fetch all users
  const { data: users = [], error: usersError } = useQuery({
    queryKey: ["/api/users"],
    meta: {
      errorMessage: "Failed to fetch users"
    }
  });

  // Fetch templates
  const { data: templates = [], error: templatesError } = useQuery({
    queryKey: ["/api/templates"],
    meta: {
      errorMessage: "Failed to fetch templates"
    }
  });

  // Fetch stats
  const { data: stats, error: statsError } = useQuery({
    queryKey: ["/api/admin/stats"],
    meta: {
      errorMessage: "Failed to fetch stats"
    }
  });

  const handleApproval = async (submissionId: number, action: "approve" | "reject" | "reassign") => {
    try {
      const payload: any = {
        action,
        comments: approvalComments,
      };

      if (action === "reassign" && assignToUser) {
        payload.assignToUserId = parseInt(assignToUser);
      }

      await apiRequest(`/api/admin/submissions/${submissionId}/approval`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Success",
        description: `Submission ${action}ed successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      setSelectedSubmission(null);
      setApprovalComments("");
      setAssignToUser("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, color: "bg-gray-500" },
      validated: { icon: CheckCircle, color: "bg-blue-500" },
      approved: { icon: CheckCircle, color: "bg-green-500" },
      rejected: { icon: XCircle, color: "bg-red-500" },
      reassigned: { icon: RefreshCw, color: "bg-yellow-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
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
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingApproval || 0}</div>
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="submissions" className="w-full">
          <TabsList>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>Review and manage user submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="text-center py-8">Loading submissions...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Reporting Period</TableHead>
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
                          <TableCell>{submission.username}</TableCell>
                          <TableCell>{submission.templateName}</TableCell>
                          <TableCell>{submission.reportingPeriod}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell>
                            {submission.validationErrors > 0 && (
                              <Badge variant="destructive" className="mr-1">
                                {submission.validationErrors} errors
                              </Badge>
                            )}
                            {submission.validationWarnings > 0 && (
                              <Badge variant="secondary">
                                {submission.validationWarnings} warnings
                              </Badge>
                            )}
                            {submission.validationErrors === 0 && submission.validationWarnings === 0 && submission.status === "validated" && (
                              <Badge variant="default" className="bg-green-500">
                                Passed
                              </Badge>
                            )}
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                Review
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>Manage validation templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => navigate("/")}>
                    Go to Template Manager
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Validation Rules</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template: any) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>{template.templateType}</TableCell>
                        <TableCell>{template.status}</TableCell>
                        <TableCell>
                          {template.validationRulesPath ? (
                            <Badge variant="default">Configured</Badge>
                          ) : (
                            <Badge variant="secondary">Not configured</Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(template.createdAt), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage system users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Review Submission #{selectedSubmission.id}</CardTitle>
              <CardDescription>
                Submitted by {selectedSubmission.username} on {format(new Date(selectedSubmission.submittedAt), "MMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Template: {selectedSubmission.templateName}</p>
                <p className="text-sm font-medium mb-2">Reporting Period: {selectedSubmission.reportingPeriod}</p>
                <p className="text-sm font-medium mb-2">
                  Validation: {selectedSubmission.validationErrors} errors, {selectedSubmission.validationWarnings} warnings
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Comments</label>
                <Textarea
                  placeholder="Add approval comments..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Assign to User (for reassignment)</label>
                <Select value={assignToUser} onValueChange={setAssignToUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u: any) => u.role === "user")
                      .map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproval(selectedSubmission.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproval(selectedSubmission.id, "reject")}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleApproval(selectedSubmission.id, "reassign")}
                  disabled={!assignToUser}
                >
                  Reassign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}