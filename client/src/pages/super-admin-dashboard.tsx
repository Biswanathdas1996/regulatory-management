import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Users,
  Building,
  TrendingUp,
  Settings,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { DataCleanupButton } from "@/components/DataCleanupButton";

interface SuperAdminAnalytics {
  systemOverview: {
    totalUsers: number;
    totalTemplates: number;
    totalSubmissions: number;
    totalCategories: number;
    systemHealthScore: number;
  };
  userAnalytics: {
    usersByRole: {
      super_admin: number;
      ifsca_user: number;
      reporting_entity: number;
    };
    usersByCategory: Array<{
      categoryId: number;
      categoryName: string;
      ifscaUsers: number;
      reportingEntities: number;
    }>;
    totalActiveUsers: number;
  };
  templateAnalytics: {
    templatesByCategory: Array<{
      categoryId: number;
      categoryName: string;
      templateCount: number;
      withValidationRules: number;
    }>;
    totalWithValidation: number;
    totalWithoutValidation: number;
  };
  submissionAnalytics: {
    submissionsByStatus: {
      pending: number;
      passed: number;
      failed: number;
      rejected: number;
      returned: number;
    };
    submissionsByCategory: Array<{
      categoryId: number;
      categoryName: string;
      totalSubmissions: number;
      passedSubmissions: number;
      failedSubmissions: number;
    }>;
    successRate: string;
  };
  complianceMetrics: {
    totalValidationRules: number;
    totalValidationResults: number;
    failedValidations: number;
    complianceRate: string;
  };
  trends: {
    monthlyTrends: Array<{
      month: string;
      submissions: number;
      passed: number;
      failed: number;
    }>;
    avgSubmissionsPerMonth: number;
  };
  recentActivity: Array<{
    date: string;
    username: string;
    action: string;
    template: string;
    category: string;
    status: string;
    reportingPeriod: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    displayName: string;
    color: string;
    isActive: boolean;
  }>;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/super-admin/analytics"],
    queryFn: async (): Promise<SuperAdminAnalytics> => {
      const response = await fetch("/api/super-admin/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <SuperAdminLayout
        title="IFSCA Dashboard"
        subtitle={`Welcome back, ${user?.username}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!analytics) {
    return (
      <SuperAdminLayout
        title="IFSCA Dashboard"
        subtitle={`Welcome back, ${user?.username}`}
      >
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load analytics data</p>
        </div>
      </SuperAdminLayout>
    );
  }

  const stats = [
    {
      title: "Total IFSCA Users",
      value: analytics.userAnalytics.usersByRole.ifsca_user.toString(),
      description: "Active regulatory administrators",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Reporting Entities",
      value: analytics.userAnalytics.usersByRole.reporting_entity.toString(),
      description: "Across all categories",
      icon: Building,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "System Templates",
      value: analytics.systemOverview.totalTemplates.toString(),
      description: "Regulatory templates",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "System Health",
      value: `${analytics.systemOverview.systemHealthScore}%`,
      description: "Validation success rate",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'returned':
        return <ArrowDown className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <SuperAdminLayout
      title="IFSCA Dashboard"
      subtitle={`Welcome back, ${user?.username}`}
    >
      <div className="space-y-6">
        {/* System Access Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200"
            >
              <Shield className="h-3 w-3 mr-1" />
              Global System Access
            </Badge>
          </div>
          <DataCleanupButton />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submission Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-gray-600" />
                Submission Status Overview
              </CardTitle>
              <CardDescription>
                Current submission status distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.submissionAnalytics.submissionsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <div>
                        <p className="font-medium text-sm capitalize">{status}</p>
                        <p className="text-xs text-gray-500">{count} submissions</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {count}
                    </Badge>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {analytics.submissionAnalytics.successRate}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                Categories Overview
              </CardTitle>
              <CardDescription>
                User and template distribution by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.userAnalytics.usersByCategory.map((category) => (
                  <div key={category.categoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {category.categoryName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {category.reportingEntities} entities • {category.ifscaUsers} IFSCA users
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Template Analytics
              </CardTitle>
              <CardDescription>
                Template distribution and validation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.templateAnalytics.templatesByCategory.map((category) => (
                  <div key={category.categoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {category.categoryName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {category.templateCount} templates • {category.withValidationRules} with rules
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {category.templateCount > 0 
                          ? Math.round((category.withValidationRules / category.templateCount) * 100)
                          : 0}% validated
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {analytics.templateAnalytics.totalWithValidation}
                      </div>
                      <div className="text-xs text-gray-500">With Validation</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">
                        {analytics.templateAnalytics.totalWithoutValidation}
                      </div>
                      <div className="text-xs text-gray-500">Without Validation</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                Compliance Metrics
              </CardTitle>
              <CardDescription>
                System validation and compliance rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.complianceMetrics.complianceRate}%
                    </div>
                    <div className="text-xs text-gray-600">Compliance Rate</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.complianceMetrics.totalValidationRules}
                    </div>
                    <div className="text-xs text-gray-600">Total Rules</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-emerald-600">
                      {analytics.complianceMetrics.totalValidationResults - analytics.complianceMetrics.failedValidations}
                    </div>
                    <div className="text-xs text-gray-600">Passed Validations</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-red-600">
                      {analytics.complianceMetrics.failedValidations}
                    </div>
                    <div className="text-xs text-gray-600">Failed Validations</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              Monthly Submission Trends
            </CardTitle>
            <CardDescription>
              Last 12 months submission activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {analytics.trends.monthlyTrends.map((month, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">{month.month}</div>
                  <div className="text-sm font-bold">{month.submissions}</div>
                  <div className="flex justify-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" title={`${month.passed} passed`}></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full" title={`${month.failed} failed`}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <div className="text-sm text-gray-600">
                Average submissions per month: <span className="font-medium">{Math.round(analytics.trends.avgSubmissionsPerMonth)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system activity and submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(activity.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {activity.username} submitted {activity.template}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.category} • {activity.reportingPeriod} • {activity.date}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
              {analytics.recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recent activity found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
