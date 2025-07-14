import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Upload, CheckCircle, AlertCircle, Clock, TrendingUp } from "lucide-react";

export default function ReportingEntityDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Total Submissions",
      value: "24",
      description: "All time submissions",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Pending Review",
      value: "3",
      description: "Awaiting IFSCA approval",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Approved",
      value: "19",
      description: "Successfully validated",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Success Rate",
      value: "87.5%",
      description: "First-time approval rate",
      icon: TrendingUp,
      color: "text-emerald-600",
    },
  ];

  const recentSubmissions = [
    {
      template: "Quarterly Financial Report Q4 2024",
      status: "approved",
      submittedAt: "3 days ago",
      reviewedAt: "1 day ago",
    },
    {
      template: "Monthly Risk Assessment Dec 2024",
      status: "pending",
      submittedAt: "1 day ago",
      reviewedAt: null,
    },
    {
      template: "Capital Adequacy Report",
      status: "returned",
      submittedAt: "5 days ago",
      reviewedAt: "2 days ago",
    },
  ];

  const upcomingDeadlines = [
    {
      template: "Monthly Liquidity Report",
      category: "Banking",
      dueDate: "Jan 15, 2025",
      daysLeft: 1,
      priority: "high",
    },
    {
      template: "Quarterly Risk Assessment",
      category: "Banking", 
      dueDate: "Jan 31, 2025",
      daysLeft: 17,
      priority: "medium",
    },
    {
      template: "Annual Compliance Report",
      category: "Banking",
      dueDate: "Mar 31, 2025",
      daysLeft: 76,
      priority: "low",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "returned":
        return <Badge className="bg-red-100 text-red-800">Returned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reporting Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.username}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {user?.category} Entity
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

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common regulatory reporting tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Upload className="h-5 w-5" />
                <span>New Submission</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <FileText className="h-5 w-5" />
                <span>Download Templates</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <TrendingUp className="h-5 w-5" />
                <span>View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Submissions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Submissions</CardTitle>
              <CardDescription>
                Your latest regulatory submissions
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
                      <h4 className="font-medium text-gray-900">{submission.template}</h4>
                      <p className="text-sm text-gray-600">Submitted {submission.submittedAt}</p>
                      {submission.reviewedAt && (
                        <p className="text-xs text-gray-500">Reviewed {submission.reviewedAt}</p>
                      )}
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

          {/* Upcoming Deadlines */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
              <CardDescription>
                Regulatory submission deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{deadline.template}</h4>
                      <p className="text-sm text-gray-600">Due: {deadline.dueDate}</p>
                      <p className="text-xs text-gray-500">{deadline.daysLeft} days remaining</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {getPriorityBadge(deadline.priority)}
                      {deadline.daysLeft <= 3 && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                View All Deadlines
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Compliance Summary</CardTitle>
            <CardDescription>
              Your regulatory compliance performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">24</div>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">87.5%</div>
                <p className="text-sm text-gray-600">First-time Approval Rate</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">1.2 days</div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}