import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Settings, Upload, FileText, User, ArrowRight, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Financial Template Validation System
            </h1>
            <p className="text-xl text-gray-600">
              Upload Excel/CSV templates with validation rules or submit forms for validation
            </p>
          </div>

          {/* Main Navigation Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Template Management Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Template Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Upload and manage Excel/CSV templates with validation rules. View processing status and manage template library.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Templates & Validation Rules
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Template Library
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Settings className="h-4 w-4 mr-2" />
                    View Processing Stats
                  </div>
                </div>
                <Link href="/template-management">
                  <Button className="w-full">
                    Go to Template Management
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* User Dashboard Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">User Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Track your submission history, view performance metrics, and analyze validation results with comprehensive KPIs.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-2" />
                    Track Submission History
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Upload className="h-4 w-4 mr-2" />
                    View Performance Metrics
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Settings className="h-4 w-4 mr-2" />
                    Analyze Validation Results
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/user-login">
                    <Button className="w-full">
                      Login to Dashboard
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/user-dashboard">
                    <Button variant="outline" className="w-full">
                      Quick Access (Demo)
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Access Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer mb-12">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Access system-wide analytics, manage all templates, and monitor user submissions across the platform.
              </p>
              <div className="grid md:grid-cols-3 gap-3 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Settings className="h-4 w-4 mr-2" />
                  System Analytics
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="h-4 w-4 mr-2" />
                  All Submissions
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Upload className="h-4 w-4 mr-2" />
                  Template Library
                </div>
              </div>
              <div className="space-y-2">
                <Link href="/admin-login">
                  <Button variant="destructive" className="w-full">
                    Admin Login
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/admin-dashboard">
                  <Button variant="outline" className="w-full">
                    Quick Access (Demo)
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access Info */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Choose your workflow above to get started with the template validation system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}