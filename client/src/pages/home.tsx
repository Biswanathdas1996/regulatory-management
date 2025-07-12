import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { SchemaDisplay } from "@/components/SchemaDisplay";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { SystemStats } from "@/components/SystemStats";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartLine, User } from "lucide-react";

export default function Home() {
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChartLine className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Financial Template Processor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">AI-Powered Schema Extraction</span>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload onTemplateUploaded={handleTemplateUploaded} />
        </div>

        {/* Selected Template Details */}
        {selectedTemplateId && (
          <div className="mb-8">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Template Details - {templates?.find(t => t.id === selectedTemplateId)?.name}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedTemplateId(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Close View
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Processing Status */}
        {selectedTemplateId && (
          <div className="mb-8">
            <ProcessingStatus templateId={selectedTemplateId} />
          </div>
        )}

        {/* Schema Output Section */}
        {selectedTemplateId && (
          <div className="mb-8">
            <SchemaDisplay templateId={selectedTemplateId} />
          </div>
        )}

        {/* Template Management */}
        <div className="mb-8">
          <TemplateLibrary 
            templates={templates || []} 
            onTemplateSelected={handleTemplateSelected}
            onTemplateDeleted={refetchTemplates}
            selectedTemplateId={selectedTemplateId}
          />
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemStats stats={stats} />
        </div>
      </main>
    </div>
  );
}
