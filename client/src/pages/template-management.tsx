import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { SystemStats } from "@/components/SystemStats";
import { Settings, Upload, FileText, BarChart3 } from "lucide-react";

export default function TemplateManagement() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const { data: templates, refetch: refetchTemplates } = useQuery({
    queryKey: ["/api/templates"],
    refetchInterval: 5000, // Refetch every 5 seconds to update processing status
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const handleTemplateUploaded = (templateId: number) => {
    setSelectedTemplateId(templateId);
    refetchTemplates();
  };

  const handleTemplateSelected = (templateId: number) => {
    setSelectedTemplateId(templateId);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
              <p className="text-gray-600 mt-2">
                Upload and manage Excel/CSV templates with validation rules
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Admin Portal</span>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <Settings className="text-white text-sm" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Library
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-8">
              <FileUpload onTemplateUploaded={handleTemplateUploaded} />
            </TabsContent>

            <TabsContent value="library" className="space-y-8">
              <TemplateLibrary 
                templates={templates || []} 
                onTemplateSelected={handleTemplateSelected}
                onTemplateDeleted={refetchTemplates}
                selectedTemplateId={selectedTemplateId}
              />
            </TabsContent>

            <TabsContent value="stats" className="space-y-8">
              <SystemStats stats={stats} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}