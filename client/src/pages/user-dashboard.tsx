import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  Download,
  Upload,
  Activity,
} from "lucide-react";
import { format, subDays, isWithinInterval } from "date-fns";
import { Link } from "wouter";
import UserLayout from "@/components/UserLayout";


export default function UserDashboardPage() {
  // Get authenticated user info
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const userId = user?.id;

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/submissions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const params = new URLSearchParams();
      params.append("userId", userId.toString());
      const response = await fetch(`/api/submissions?${params}`);
      return response.json();
    },
    enabled: !!userId, // Only run when we have a userId
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates/with-rules"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 60000,
  });

  if (submissionsLoading || templatesLoading || statsLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate KPIs - ensure submissions is an array
  const submissionsArray = Array.isArray(submissions) ? submissions : [];
  const totalSubmissions = submissionsArray.length;
  const passedSubmissions = submissionsArray.filter(
    (s: any) => s.status === "passed"
  ).length;
  const failedSubmissions = submissionsArray.filter(
    (s: any) => s.status === "failed"
  ).length;
  const validatingSubmissions = submissionsArray.filter(
    (s: any) => s.status === "validating"
  ).length;
  const successRate =
    totalSubmissions > 0
      ? Math.round((passedSubmissions / totalSubmissions) * 100)
      : 0;

  // Recent activity (last 7 days)
  const last7Days = subDays(new Date(), 7);
  const recentSubmissions = submissionsArray.filter(
    (s: any) => new Date(s.createdAt) > last7Days
  );

  // Template usage stats
  const templateUsage = submissionsArray.reduce((acc: any, sub: any) => {
    acc[sub.templateId] = (acc[sub.templateId] || 0) + 1;
    return acc;
  }, {});

  // Validation errors by template
  const validationErrors = submissionsArray.reduce((acc: any, sub: any) => {
    if (sub.status === "failed") {
      acc[sub.templateId] =
        (acc[sub.templateId] || 0) + (sub.validationErrors || 0);
    }
    return acc;
  }, {});

  // Monthly trend (last 30 days)
  const last30Days = subDays(new Date(), 30);
  const monthlySubmissions = submissionsArray.filter(
    (s: any) => new Date(s.createdAt) > last30Days
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "validating":
        return "text-yellow-600";
      default:
        return "text-gray-600";
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
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <UserLayout
      title="Reporting Entity Dashboard"
      subtitle="Track your template submissions and validation results"
      headerActions={
        <Link to="/reporting-entity/submission">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            New Submission
          </Button>
        </Link>
      }
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Submissions
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900">
              {totalSubmissions}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <span className="text-blue-600 font-medium">
                +{recentSubmissions.length}
              </span>{" "}
              in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Success Rate
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-green-600">
              {successRate}%
            </div>
            <Progress value={successRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Failed Submissions
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-600">
              {failedSubmissions}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(
                (failedSubmissions / Math.max(totalSubmissions, 1)) * 100
              )}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Validations
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-orange-600">
              {validatingSubmissions}
            </div>
            <p className="text-sm text-gray-500 mt-2">Currently processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-gray-100/50 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
          >
            Submissions
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
          >
            Templates
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSubmissions.length === 0 ? (
                  <p className="text-gray-500">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentSubmissions.slice(0, 5).map((submission: any) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(submission.status)}
                          <div>
                            <p className="font-medium text-sm">
                              {submission.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(
                                new Date(submission.createdAt),
                                "MMM dd, HH:mm"
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={getStatusColor(submission.status)}
                        >
                          {submission.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </div>
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-bold">
                      {monthlySubmissions.length} submissions
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Passed</span>
                    <span className="font-bold text-green-600">
                      {
                        monthlySubmissions.filter(
                          (s: any) => s.status === "passed"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-bold text-red-600">
                      {
                        monthlySubmissions.filter(
                          (s: any) => s.status === "failed"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-bold">
                      {monthlySubmissions.length > 0
                        ? Math.round(
                            (monthlySubmissions.filter(
                              (s: any) => s.status === "passed"
                            ).length /
                              monthlySubmissions.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
              <p className="text-sm text-gray-600">
                Complete history of your template submissions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!submissions || submissions.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No submissions found.{" "}
                      <Link
                        to="/reporting-entity/submission"
                        className="text-blue-600 hover:underline"
                      >
                        Upload your first submission
                      </Link>{" "}
                      to get started.
                    </AlertDescription>
                  </Alert>
                ) : (
                  submissions.slice(0, 10).map((submission: any) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(submission.status)}
                        <div>
                          <p className="font-medium">{submission.fileName}</p>
                          <p className="text-sm text-gray-500">
                            Template {submission.templateId} •{" "}
                            {submission.reportingPeriod}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(
                              new Date(submission.createdAt),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={getStatusColor(submission.status)}
                        >
                          {submission.status}
                        </Badge>
                        {submission.status === "failed" && (
                          <Badge variant="destructive">
                            {submission.validationErrors || 0} errors
                          </Badge>
                        )}
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
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Usage</CardTitle>
              <p className="text-sm text-gray-600">
                Your submission patterns by template
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(templateUsage).length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No template usage data available. Submit some templates to
                      see usage statistics.
                    </AlertDescription>
                  </Alert>
                ) : (
                  Object.entries(templateUsage).map(
                    ([templateId, count]: [string, any]) => {
                      const template = templates?.find(
                        (t: any) => t.id === parseInt(templateId)
                      );
                      const errors = validationErrors[templateId] || 0;
                      const successRate = Math.round(
                        ((count -
                          (submissions?.filter(
                            (s: any) =>
                              s.templateId === parseInt(templateId) &&
                              s.status === "failed"
                          ).length || 0)) /
                          count) *
                          100
                      );

                      return (
                        <div key={templateId} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                              {template?.name || `Template ${templateId}`}
                            </h3>
                            <Badge variant="outline">{count} submissions</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Success Rate</p>
                              <p className="font-medium text-green-600">
                                {successRate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Errors</p>
                              <p className="font-medium text-red-600">
                                {errors}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Template Type</p>
                              <p className="font-medium">
                                {template?.templateType || "Unknown"}
                              </p>
                            </div>
                          </div>
                          <Progress value={successRate} className="mt-2" />
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  System Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Total Templates
                    </span>
                    <span className="font-medium">
                      {stats?.totalTemplates || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Templates Processed
                    </span>
                    <span className="font-medium">{stats?.processed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing</span>
                    <span className="font-medium">
                      {stats?.processing || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-medium">{stats?.failed || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Avg. Processing Time
                    </span>
                    <span className="font-medium">2.3 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Total Validations
                    </span>
                    <span className="font-medium">
                      {stats?.totalValidations || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Avg. File Size
                    </span>
                    <span className="font-medium">
                      {submissions?.length > 0
                        ? Math.round(
                            submissions.reduce(
                              (sum: number, s: any) => sum + s.fileSize,
                              0
                            ) /
                              submissions.length /
                              1024
                          ) + " KB"
                        : "0 KB"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </UserLayout>
  );
}
