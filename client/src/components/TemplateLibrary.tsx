import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Download, Trash2, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TemplateLibraryProps {
  templates: any[];
  onTemplateSelected: (templateId: number) => void;
  onTemplateDeleted: () => void;
  selectedTemplateId?: number | null;
}

export function TemplateLibrary({ templates, onTemplateSelected, onTemplateDeleted, selectedTemplateId }: TemplateLibraryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const deleteMutation = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest(`/api/templates/${templateId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      onTemplateDeleted();
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  });

  const getTemplateTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      "monthly-clearing": "Monthly Clearing",
      "quarterly-capital": "Quarterly Capital Market",
      "liabilities": "Liabilities",
      "stock-mar": "Stock MAR",
      "stock-mdr": "Stock MDR",
      "treasury": "Treasury Report"
    };
    return typeLabels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✓";
      case "processing":
        return "⟳";
      case "failed":
        return "✗";
      default:
        return "○";
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'csv' ? <FileText className="h-5 w-5 text-orange-500" /> : <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const handleDownload = async (templateId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/download`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Template Library</CardTitle>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className={`hover:bg-gray-50 ${selectedTemplateId === template.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getFileIcon(template.fileName)}
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${selectedTemplateId === template.id ? 'text-blue-900' : 'text-gray-900'}`}>
                          {template.name}
                          {selectedTemplateId === template.id && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Viewing
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {template.fileName} • {formatFileSize(template.fileSize)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="text-xs">
                      {getTemplateTypeLabel(template.templateType)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                        {getStatusIcon(template.status)} {template.status}
                      </Badge>
                      {template.validationRulesPath && (
                        <Badge variant="outline" className="text-xs">
                          ✓ Rules
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(template.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/template/${template.id}`)}
                      title="View template details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(template.id, template.fileName)}
                      disabled={template.status !== "completed"}
                      title="Download template"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(template.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {templates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No templates uploaded yet. Upload your first template to get started.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
