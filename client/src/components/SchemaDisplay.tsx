import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SchemaDisplayProps {
  templateId: number;
}

export function SchemaDisplay({ templateId }: SchemaDisplayProps) {
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: sheets } = useQuery({
    queryKey: ["/api/templates", templateId, "sheets"],
  });

  const { data: schemas } = useQuery({
    queryKey: ["/api/templates", templateId, "schemas"],
  });

  const { data: selectedSchema } = useQuery({
    queryKey: ["/api/templates", templateId, "schemas", selectedSheetId],
    enabled: selectedSheetId !== null,
  });

  const handleCopySchema = async () => {
    if (!selectedSchema) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedSchema.schemaData, null, 2));
      toast({
        title: "Copied",
        description: "Schema copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy schema",
        variant: "destructive",
      });
    }
  };

  const handleExportSchema = () => {
    if (!selectedSchema) return;
    
    const dataStr = JSON.stringify(selectedSchema.schemaData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `schema_${selectedSchema.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Show loading state if no schemas available yet
  if (!schemas || schemas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Generated Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Schema generation in progress...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group schemas by sheet
  const sheetSchemas = schemas.filter((s: any) => s.sheetId !== null);
  const consolidatedSchema = schemas.find((s: any) => s.sheetId === null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Generated Schema</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySchema}
              disabled={!selectedSchema}
            >
              <Copy className="mr-1 h-4 w-4" />
              Copy
            </Button>
            <Button
              size="sm"
              onClick={handleExportSchema}
              disabled={!selectedSchema}
            >
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={sheetSchemas[0]?.sheetId?.toString() || "consolidated"}>
          <TabsList className="grid w-full grid-cols-auto">
            {sheetSchemas.map((schema: any) => {
              const sheet = sheets?.find((s: any) => s.id === schema.sheetId);
              return (
                <TabsTrigger 
                  key={schema.sheetId} 
                  value={schema.sheetId.toString()}
                  onClick={() => setSelectedSheetId(schema.sheetId)}
                >
                  {sheet?.sheetName || `Sheet ${schema.sheetId}`}
                </TabsTrigger>
              );
            })}
            {consolidatedSchema && (
              <TabsTrigger 
                value="consolidated"
                onClick={() => setSelectedSheetId(null)}
              >
                Consolidated
              </TabsTrigger>
            )}
          </TabsList>

          {sheetSchemas.map((schema: any) => {
            const sheet = sheets?.find((s: any) => s.id === schema.sheetId);
            return (
              <TabsContent key={schema.sheetId} value={schema.sheetId.toString()}>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {sheet?.sheetName || `Sheet ${schema.sheetId}`} Schema
                    </h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        {schema.schemaData.required_fields?.length || 0} key fields identified
                      </span>
                      <span className="text-xs text-gray-500">
                        AI Confidence: {schema.aiConfidence}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded border p-3 font-mono text-sm text-gray-800 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(schema.schemaData, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            );
          })}

          {consolidatedSchema && (
            <TabsContent value="consolidated">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Consolidated Schema
                  </h3>
                  <span className="text-xs text-gray-500">
                    AI Confidence: {consolidatedSchema.aiConfidence}%
                  </span>
                </div>
                <div className="bg-white rounded border p-3 font-mono text-sm text-gray-800 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(consolidatedSchema.schemaData, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
