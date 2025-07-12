import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileText, Eye, Download, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export default function TemplatesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("library");

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {user?.role === "admin" ? "Admin Panel" : "Dashboard"}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Manager</h1>
            <p className="text-gray-600">Manage validation templates and rules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Template Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Template
              </CardTitle>
              <CardDescription>
                Upload Excel or CSV templates with validation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Upload Template</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Select Excel (.xlsx, .xls) or CSV files to upload as templates
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Go to Upload Page
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Templates Overview</CardTitle>
              <CardDescription>All available templates in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template: any) => (
                  <Card key={template.id} className="border-2 hover:border-blue-200 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.templateType}
                          </CardDescription>
                        </div>
                        <Badge variant={template.status === "active" ? "default" : "secondary"}>
                          {template.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">File Size:</span>
                          <span>{(template.fileSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span>{format(new Date(template.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Validation Rules:</span>
                          {template.validationRulesPath ? (
                            <Badge variant="default" className="text-xs">Configured</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Not configured</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/template/${template.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/api/templates/${template.id}/download`;
                            link.download = template.fileName;
                            link.click();
                          }}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No templates available</p>
                  <p className="text-sm">Upload your first template to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}