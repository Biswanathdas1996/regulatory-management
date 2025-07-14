import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, FileText, TrendingUp, Building, Settings } from "lucide-react";

export default function IFSCADashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Reporting Entities",
      value: "45",
      description: `In ${user?.category} category`,
      icon: Building,
      color: "text-blue-600",
    },
    {
      title: "Active Templates",
      value: "6",
      description: "Regulatory templates",
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Pending Submissions",
      value: "12",
      description: "Awaiting review",
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: "Compliance Rate",
      value: "94.2%",
      description: "This quarter",
      icon: Shield,
      color: "text-emerald-600",
    },
  ];

  const recentSubmissions = [
    {
      entity: "ABC Banking Ltd",
      template: "Quarterly Report Q4 2024",
      status: "pending",
      submittedAt: "2 hours ago",
    },
    {
      entity: "XYZ Financial Services",
      template: "Monthly Risk Assessment",
      status: "approved",
      submittedAt: "1 day ago",
    },
    {
      entity: "DEF Investment Bank",
      template: "Capital Adequacy Report",
      status: "returned",
      submittedAt: "2 days ago",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "returned":
        return <Badge className="bg-red-100 text-red-800">Returned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IFSCA Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.username}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {user?.category} Category Administrator
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Submissions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Submissions</CardTitle>
              <CardDescription>
                Latest submissions from reporting entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSubmissions.map((submission, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{submission.entity}</h4>
                      <p className="text-sm text-gray-600">{submission.template}</p>
                      <p className="text-xs text-gray-500 mt-1">{submission.submittedAt}</p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                View All Submissions
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>
                Category administration tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Reporting Entities
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Template Management
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Compliance Reports
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Category Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Category Performance</CardTitle>
            <CardDescription>
              {user?.category} category compliance and submission trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">78</div>
                <p className="text-sm text-gray-600">Submissions This Month</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">94.2%</div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">2.3 days</div>
                <p className="text-sm text-gray-600">Avg Review Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}