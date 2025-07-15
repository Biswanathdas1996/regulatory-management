import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  Database,
} from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: submissions } = useQuery({
    queryKey: ["/api/admin/submissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/submissions");
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["/api/templates"],
  });

  // Calculate metrics - ensure submissions is always an array
  const submissionsArray = Array.isArray(submissions) ? submissions : [];
  const templatesArray = Array.isArray(templates) ? templates : [];
  const totalTemplates = templatesArray.length || 0;
  const totalSubmissions = submissionsArray.length || 0;
  const passedSubmissions =
    submissionsArray.filter((s: any) => s.status === "passed").length || 0;
  const failedSubmissions =
    submissionsArray.filter((s: any) => s.status === "failed").length || 0;
  const pendingSubmissions =
    submissionsArray.filter((s: any) => s.status === "pending").length || 0;
  const approvedSubmissions =
    submissionsArray.filter((s: any) => s.status === "approved").length || 0;
  const rejectedSubmissions =
    submissionsArray.filter((s: any) => s.status === "rejected").length || 0;
  const returnedSubmissions =
    submissionsArray.filter((s: any) => s.status === "returned").length || 0;

  // Prepare chart data
  const statusData = [
    { name: "Passed", value: passedSubmissions, color: "#10b981" },
    { name: "Failed", value: failedSubmissions, color: "#ef4444" },
    { name: "Pending", value: pendingSubmissions, color: "#6b7280" },
    { name: "Approved", value: approvedSubmissions, color: "#3b82f6" },
    { name: "Rejected", value: rejectedSubmissions, color: "#dc2626" },
    { name: "Returned", value: returnedSubmissions, color: "#f59e0b" },
  ];

  // Group submissions by date for trend chart
  const submissionsByDate =
    submissionsArray?.reduce((acc: any, submission: any) => {
      try {
        const date = format(
          new Date(submission.createdAt || Date.now()),
          "MMM dd"
        );
        acc[date] = (acc[date] || 0) + 1;
      } catch (error) {
        // Skip invalid dates
      }
      return acc;
    }, {}) || {};

  const trendData = Object.entries(submissionsByDate)
    .map(([date, count]) => ({
      date,
      submissions: count,
    }))
    .slice(-7); // Last 7 days

  return (
    <AdminLayout
      title="Regulator Dashboard"
      subtitle="System overview and performance metrics"
    >
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Templates
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900">
              {totalTemplates}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <span className="text-green-600 font-medium">
                {(stats as any)?.processed || 0}
              </span>{" "}
              processed
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Submissions
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900">
              {totalSubmissions}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <span className="text-orange-600 font-medium">
                {pendingSubmissions}
              </span>{" "}
              pending review
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
              {totalSubmissions > 0
                ? Math.round((passedSubmissions / totalSubmissions) * 100)
                : 0}
              %
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {passedSubmissions} passed submissions
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Reporting Entities
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900">
              {new Set(submissions?.map((s: any) => s.userId)).size || 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">Unique submitters</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Submission Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center mr-3">
                <Activity className="h-4 w-4 text-orange-600" />
              </div>
              Submission Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Submission Trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              Daily Submission Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {submissionsArray?.slice(0, 5).map((submission: any) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      submission.status === "passed" ||
                      submission.status === "approved"
                        ? "bg-green-50"
                        : submission.status === "failed" ||
                          submission.status === "rejected"
                        ? "bg-red-50"
                        : submission.status === "returned"
                        ? "bg-yellow-50"
                        : submission.status === "pending"
                        ? "bg-blue-50"
                        : "bg-gray-50"
                    }`}
                  >
                    {submission.status === "passed" ||
                    submission.status === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : submission.status === "failed" ||
                      submission.status === "rejected" ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : submission.status === "returned" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : submission.status === "pending" ? (
                      <Activity className="h-5 w-5 text-blue-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {submission.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {submission.userName || `User #${submission.userId}`} •{" "}
                      {submission.createdAt
                        ? format(
                            new Date(submission.createdAt),
                            "MMM dd, yyyy HH:mm"
                          )
                        : "Unknown date"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    submission.status === "passed" ||
                    submission.status === "approved"
                      ? "default"
                      : submission.status === "failed" ||
                        submission.status === "rejected"
                      ? "destructive"
                      : submission.status === "returned"
                      ? "secondary"
                      : submission.status === "pending"
                      ? "outline"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {submission.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
