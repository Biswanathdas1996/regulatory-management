import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { SystemStats } from "@/components/SystemStats";
import { Upload, FileText, BarChart3 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function TemplateManagement() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );

  const { data: templates, refetch: refetchTemplates } = useQuery<any[]>({
    queryKey: ["/api/templates"],
    refetchInterval: 5000, // Refetch every 5 seconds to update processing status
  });

  const { data: stats } = useQuery<{
    totalTemplates: number;
    processed: number;
    processing: number;
    failed: number;
    averageConfidence: number;
  }>({
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
    <AdminLayout
      title="Template Management"
      subtitle="Upload and manage Excel/CSV templates with validation rules"
    >
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
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
    </AdminLayout>
  );
}
