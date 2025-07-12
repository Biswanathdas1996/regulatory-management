import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Settings, Upload, FileText, User, ArrowRight } from "lucide-react";

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

            {/* User Submission Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">User Submission</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Download templates, fill them out, and submit for validation. Get detailed validation results with error reporting.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Available Templates
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Filled Templates
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Settings className="h-4 w-4 mr-2" />
                    View Validation Results
                  </div>
                </div>
                <Link href="/user-submission">
                  <Button className="w-full">
                    Go to User Submission
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

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