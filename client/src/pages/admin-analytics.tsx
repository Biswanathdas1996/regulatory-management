import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Target,
  Calendar,
  Activity,
  PieChart,
} from "lucide-react";
import { format, subDays, subMonths, parseISO } from "date-fns";

interface AnalyticsData {
  totalSubmissions: number;
  submissionsByStatus: {
    passed: number;
    failed: number;
    pending: number;
    rejected: number;
    returned: number;
  };
  submissionTrends: {
    period: string;
    count: number;
    status: string;
  }[];
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    submissionsPerUser: number;
  };
  templateAnalytics: {
    templateName: string;
    submissionCount: number;
    successRate: number;
    avgProcessingTime: number;
  }[];
  complianceMetrics: {
    onTimeSubmissions: number;
    overdueSubmissions: number;
    complianceRate: number;
  };
  recentActivity: {
    date: string;
    username: string;
    action: string;
    template: string;
    status: string;
  }[];
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const userCategory = user?.category;

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", userCategory],
    queryFn: async (): Promise<AnalyticsData> => {
      const response = await fetch(`/api/admin/analytics?category=${userCategory}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  // Fetch submissions for category
  const { data: submissions } = useQuery({
    queryKey: ["/api/admin/submissions", userCategory],
    queryFn: async () => {
      const response = await fetch(`/api/admin/submissions?category=${userCategory}`);
      return response.json();
    },
  });

  // Fetch users for category
  const { data: users } = useQuery({
    queryKey: ["/api/admin/users", userCategory],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users?category=${userCategory}`);
      return response.json();
    },
  });

  // Fetch templates for category
  const { data: templates } = useQuery({
    queryKey: ["/api/templates", userCategory],
    queryFn: async () => {
      const response = await fetch("/api/templates");
      return response.json();
    },
  });

  // Calculate analytics from real data
  const calculateAnalytics = (): AnalyticsData => {
    if (!submissions || !users || !templates) {
      return {
        totalSubmissions: 0,
        submissionsByStatus: { passed: 0, failed: 0, pending: 0, rejected: 0, returned: 0 },
        submissionTrends: [],
        userEngagement: { totalUsers: 0, activeUsers: 0, submissionsPerUser: 0 },
        templateAnalytics: [],
        complianceMetrics: { onTimeSubmissions: 0, overdueSubmissions: 0, complianceRate: 0 },
        recentActivity: [],
      };
    }

    // Status breakdown
    const submissionsByStatus = submissions.reduce(
      (acc: any, sub: any) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      },
      { passed: 0, failed: 0, pending: 0, rejected: 0, returned: 0 }
    );

    // User engagement
    const activeUserIds = new Set(submissions.map((s: any) => s.userId));
    const userEngagement = {
      totalUsers: users.length,
      activeUsers: activeUserIds.size,
      submissionsPerUser: users.length > 0 ? submissions.length / users.length : 0,
    };

    // Template analytics
    const templateStats = templates.map((template: any) => {
      const templateSubmissions = submissions.filter((s: any) => s.templateId === template.id);
      const successfulSubmissions = templateSubmissions.filter((s: any) => s.status === 'passed');
      
      return {
        templateName: template.name,
        submissionCount: templateSubmissions.length,
        successRate: templateSubmissions.length > 0 ? (successfulSubmissions.length / templateSubmissions.length) * 100 : 0,
        avgProcessingTime: 2.5, // Mock data - would need processing time tracking
      };
    });

    // Submission trends (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      const daySubmissions = submissions.filter((s: any) => {
        const subDate = parseISO(s.createdAt);
        return subDate.toDateString() === date.toDateString();
      });
      
      return {
        period: format(date, 'MMM dd'),
        count: daySubmissions.length,
        status: 'all',
      };
    }).reverse();

    // Compliance metrics
    const totalSubmissions = submissions.length;
    const onTimeSubmissions = submissions.filter((s: any) => s.status === 'passed' || s.status === 'pending').length;
    const complianceRate = totalSubmissions > 0 ? (onTimeSubmissions / totalSubmissions) * 100 : 0;

    // Recent activity
    const recentActivity = submissions
      .slice(-10)
      .reverse()
      .map((s: any) => {
        const user = users.find((u: any) => u.id === s.userId);
        const template = templates.find((t: any) => t.id === s.templateId);
        
        return {
          date: format(parseISO(s.createdAt), 'MMM dd, HH:mm'),
          username: user?.username || 'Unknown User',
          action: 'Submitted',
          template: template?.name || 'Unknown Template',
          status: s.status,
        };
      });

    return {
      totalSubmissions: submissions.length,
      submissionsByStatus,
      submissionTrends: last30Days,
      userEngagement,
      templateAnalytics: templateStats,
      complianceMetrics: {
        onTimeSubmissions,
        overdueSubmissions: totalSubmissions - onTimeSubmissions,
        complianceRate,
      },
      recentActivity,
    };
  };

  const analyticsData = calculateAnalytics();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'returned': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'returned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Analytics" subtitle={`Category: ${user?.category || 'All'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics Dashboard" subtitle={`Comprehensive analytics for ${user?.category || 'all'} category`}>
      <div className="space-y-6">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.totalSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.totalSubmissions > 0 
                      ? Math.round((analyticsData.submissionsByStatus.passed / analyticsData.totalSubmissions) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.userEngagement.activeUsers}/{analyticsData.userEngagement.totalUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analyticsData.complianceMetrics.complianceRate)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Submission Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.submissionsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="font-medium capitalize">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${
                            status === 'passed' ? 'bg-green-500' :
                            status === 'failed' ? 'bg-red-500' :
                            status === 'pending' ? 'bg-blue-500' :
                            status === 'rejected' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}
                          style={{
                            width: analyticsData.totalSubmissions > 0 
                              ? `${(count / analyticsData.totalSubmissions) * 100}%` 
                              : '0%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                User Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>User Participation</span>
                    <span>{Math.round((analyticsData.userEngagement.activeUsers / analyticsData.userEngagement.totalUsers) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(analyticsData.userEngagement.activeUsers / analyticsData.userEngagement.totalUsers) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{analyticsData.userEngagement.totalUsers}</p>
                    <p className="text-xs text-gray-600">Total Users</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{analyticsData.userEngagement.submissionsPerUser.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">Avg Submissions/User</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Template Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Template</th>
                    <th className="text-center py-2">Submissions</th>
                    <th className="text-center py-2">Success Rate</th>
                    <th className="text-center py-2">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.templateAnalytics.map((template, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 font-medium">{template.templateName}</td>
                      <td className="text-center py-3">{template.submissionCount}</td>
                      <td className="text-center py-3">
                        <Badge variant="outline" className={
                          template.successRate >= 80 ? 'border-green-500 text-green-700' :
                          template.successRate >= 60 ? 'border-yellow-500 text-yellow-700' :
                          'border-red-500 text-red-700'
                        }>
                          {template.successRate.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-center py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              template.successRate >= 80 ? 'bg-green-500' :
                              template.successRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${template.successRate}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(activity.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {activity.username} {activity.action.toLowerCase()} {activity.template}
                      </p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
              {analyticsData.recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recent activity found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}