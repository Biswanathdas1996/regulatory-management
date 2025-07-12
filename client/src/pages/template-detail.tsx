import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Database, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { SchemaDisplay } from "@/components/SchemaDisplay";
import { ExcelViewer } from "@/components/ExcelViewer";
import { ValidationRulesManager } from "@/components/ValidationRulesManager";

export default function TemplateDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const templateId = parseInt(params.id);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['/api/templates', templateId],
    enabled: !!templateId,
  });

  const { data: sheets } = useQuery({
    queryKey: ['/api/templates', templateId, 'sheets'],
    enabled: !!templateId,
  });

  const { data: schemas } = useQuery({
    queryKey: ['/api/templates', templateId, 'schemas'],
    enabled: !!templateId,
  });

  if (templateLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-4">The template you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-gray-600 mt-1">
                {template.templateType} • Uploaded {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusIcon(template.status)}
            <Badge className={getStatusColor(template.status)}>
              {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Template Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">File Name</p>
              <p className="text-lg text-gray-900">{template.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Template Type</p>
              <p className="text-lg text-gray-900">{template.templateType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">File Size</p>
              <p className="text-lg text-gray-900">{template.fileSize ? `${(template.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sheets</p>
              <p className="text-lg text-gray-900">{sheets?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Schemas Generated</p>
              <p className="text-lg text-gray-900">{schemas?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-lg text-gray-900">{new Date(template.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status Section */}
      <div className="mb-8">
        <ProcessingStatus templateId={templateId} />
      </div>

      {/* Generated Schemas Section */}
      {template.status === "completed" && schemas && schemas.length > 0 && (
        <div className="mb-8 space-y-8">
          <SchemaDisplay 
            templateId={templateId} 
            selectedSheetId={selectedSheetId}
            onSheetChange={setSelectedSheetId}
          />
          
          {/* Excel Viewer Section */}
          <ExcelViewer 
            templateId={templateId} 
            selectedSheetId={selectedSheetId}
            sheets={sheets}
          />
        </div>
      )}

      {/* Validation Rules Section */}
      <div className="mb-8">
        <ValidationRulesManager 
          templateId={templateId}
          sheets={sheets}
        />
      </div>

      {/* No Schemas Message */}
      {template.status === "completed" && (!schemas || schemas.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schemas Generated</h3>
              <p className="text-gray-600">
                This template has been processed but no schemas were generated. This might indicate an issue with the file format or content.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}