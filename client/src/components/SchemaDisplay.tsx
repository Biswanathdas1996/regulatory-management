import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Table, Code, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SchemaDisplayProps {
  templateId: number;
}

export function SchemaDisplay({ templateId }: SchemaDisplayProps) {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const { toast } = useToast();

  const { data: sheets } = useQuery({
    queryKey: ["/api/templates", templateId, "sheets"],
  });

  const { data: schemas } = useQuery({
    queryKey: ["/api/templates", templateId, "schemas"],
  });

  const handleCopySchema = async (schema: any) => {
    if (!schema) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(schema.schemaData, null, 2));
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

  const handleExportSchema = (schema: any) => {
    if (!schema) return;
    
    const dataStr = JSON.stringify(schema.schemaData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `schema_${schema.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderTableView = (schema: any) => {
    const fields = schema.schemaData.required_fields || [];
    const calculatedFields = schema.schemaData.calculated_fields || [];
    
    return (
      <div className="space-y-4">
        {fields.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Fields</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map((field: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.field_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs">
                          {field.data_type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {field.description}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {field.is_required ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {calculatedFields.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Calculated Fields</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formula</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculatedFields.map((field: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.field_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-600">
                        {field.formula}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {field.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderJsonView = (schema: any) => {
    return (
      <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
        <pre className="text-green-400 font-mono text-sm overflow-x-auto">
          {JSON.stringify(schema.schemaData, null, 2)}
        </pre>
      </div>
    );
  };

  // Show loading state if no schemas available yet
  if (!schemas || schemas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Generated Schemas</CardTitle>
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Generated Schemas</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'json' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('json')}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={sheetSchemas[0]?.sheetId?.toString() || "consolidated"} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-auto">
              {sheetSchemas.map((schema: any) => {
                const sheet = sheets?.find((s: any) => s.id === schema.sheetId);
                return (
                  <TabsTrigger 
                    key={schema.sheetId} 
                    value={schema.sheetId.toString()}
                    className="text-xs px-3 py-1"
                  >
                    {sheet?.sheetName || `Sheet ${schema.sheetId}`}
                  </TabsTrigger>
                );
              })}
              {consolidatedSchema && (
                <TabsTrigger 
                  value="consolidated"
                  className="text-xs px-3 py-1"
                >
                  Consolidated
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {sheetSchemas.map((schema: any) => {
            const sheet = sheets?.find((s: any) => s.id === schema.sheetId);
            return (
              <TabsContent key={schema.sheetId} value={schema.sheetId.toString()} className="mt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-xs">
                        {schema.schemaData.required_fields?.length || 0} fields
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {schema.aiConfidence}% confidence
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopySchema(schema)}
                        className="h-8 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleExportSchema(schema)}
                        className="h-8 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 bg-white">
                    {viewMode === 'table' ? renderTableView(schema) : renderJsonView(schema)}
                  </div>
                </div>
              </TabsContent>
            );
          })}

          {consolidatedSchema && (
            <TabsContent value="consolidated" className="mt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="text-xs">
                      Consolidated
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {consolidatedSchema.aiConfidence}% confidence
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleCopySchema(consolidatedSchema)}
                      className="h-8 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleExportSchema(consolidatedSchema)}
                      className="h-8 px-2"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3 bg-white">
                  {viewMode === 'table' ? renderTableView(consolidatedSchema) : renderJsonView(consolidatedSchema)}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}