import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Shield, Users, Building, TrendingUp, Settings, FileText } from "lucide-react";

export default function SuperAdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Total IFSCA Users",
      value: "12",
      description: "Active regulatory administrators",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Reporting Entities",
      value: "156",
      description: "Across all categories",
      icon: Building,
      color: "text-green-600",
    },
    {
      title: "System Templates",
      value: "8",
      description: "Regulatory templates",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Platform Health",
      value: "99.9%",
      description: "System uptime",
      icon: TrendingUp,
      color: "text-emerald-600",
    },
  ];

  const categories = [
    { name: "Banking", entities: 78, users: 4, status: "active" },
    { name: "NBFC", entities: 45, users: 4, status: "active" },
    { name: "Stock Exchange", entities: 33, users: 4, status: "active" },
  ];

  return (
    <SuperAdminLayout 
      title="Super Admin Dashboard" 
      subtitle={`Welcome back, ${user?.username}`}
    >
      <div className="space-y-6">
        {/* System Access Badge */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <Shield className="h-3 w-3 mr-1" />
            Global System Access
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Categories Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Category Overview</CardTitle>
              <CardDescription>
                IFSCA User and Reporting Entity distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">
                        {category.entities} entities • {category.users} IFSCA users
                      </p>
                    </div>
                    <Badge
                      variant={category.status === "active" ? "default" : "secondary"}
                      className="bg-green-100 text-green-800"
                    >
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>
                Global system administration tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage IFSCA Users
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Building className="h-4 w-4 mr-2" />
                  View All Reporting Entities
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  System Templates
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Platform Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent System Activity</CardTitle>
            <CardDescription>
              Latest platform-wide events and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">New IFSCA User Created</p>
                  <p className="text-sm text-gray-600">Banking category administrator added</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Template Updated</p>
                  <p className="text-sm text-gray-600">Quarterly reporting template v2.1 published</p>
                </div>
                <span className="text-sm text-gray-500">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">System Maintenance</p>
                  <p className="text-sm text-gray-600">Database optimization completed</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}