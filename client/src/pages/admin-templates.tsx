import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Building,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminTemplatesPage() {
  const { user } = useAuth();
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/templates/with-rules"],
    queryFn: async () => {
      const response = await fetch("/api/templates/with-rules");
      return response.json();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "banking":
        return <Landmark className="h-4 w-4 text-blue-600" />;
      case "nbfc":
        return <Building className="h-4 w-4 text-green-600" />;
      case "stock_exchange":
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "banking":
        return "bg-blue-100 text-blue-800";
      case "nbfc":
        return "bg-green-100 text-green-800";
      case "stock_exchange":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "banking":
        return "Banking";
      case "nbfc":
        return "NBFC";
      case "stock_exchange":
        return "Stock Exchange";
      default:
        return category;
    }
  };

  // Group templates by category for super admins
  const groupedTemplates = templates ? 
    templates.reduce((acc: any, template: any) => {
      const category = template.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {}) : {};

  const categories = Object.keys(groupedTemplates).sort();

  // Determine which layout to use based on user role
  const LayoutComponent = user?.role === "super_admin" ? SuperAdminLayout : AdminLayout;

  if (isLoading) {
    return (
      <LayoutComponent
        title="Template Library"
        subtitle="Manage all system templates"
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent
      title="Template Library"
      subtitle="Manage all system templates and validation rules"
      headerActions={
        <Link to="/regulator/template-management">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Template
          </Button>
        </Link>
      }
    >
      {!templates || templates.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No templates available</p>
              <Link to="/regulator/template-management">
                <Button className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Template
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : user?.role === "super_admin" ? (
        // Super Admin view - Segregated by category
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category} className="border-0 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mr-3">
                    {getCategoryIcon(category)}
                  </div>
                  {getCategoryName(category)} Templates ({groupedTemplates[category]?.length || 0})
                  <Badge className={`ml-3 ${getCategoryColor(category)}`}>
                    {getCategoryName(category)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validation Rules</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedTemplates[category]?.map((template: any) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span>{template.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {template.templateType || "Standard"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(template.status)}
                              <Badge className={getStatusColor(template.status)}>
                                {template.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.validationRulesCount > 0 ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">
                                  {template.validationRulesCount} rules
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  No rules
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {format(new Date(template.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {template.submissionCount || 0} submissions
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <a
                                href={`/api/templates/${template.id}/download`}
                                download
                                className="inline-flex"
                              >
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                              <Link
                                to={`/regulator/template-management?template=${template.id}`}
                              >
                                <Button size="sm" variant="outline">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Regular admin view - Single table
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              System Templates ({templates?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validation Rules</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template: any) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.templateType || "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(template.status)}
                          <Badge className={getStatusColor(template.status)}>
                            {template.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.validationRulesCount > 0 ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">
                              {template.validationRulesCount} rules
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              No rules
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(template.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {template.submissionCount || 0} submissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/templates/${template.id}/download`}
                            download
                            className="inline-flex"
                          >
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                          <Link
                            to={`/regulator/template-management?template=${template.id}`}
                          >
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </LayoutComponent>
  );
}
