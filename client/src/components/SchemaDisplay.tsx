import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Table, Code, CheckCircle, XCircle, FileJson, Database } from "lucide-react";
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
      <div className="space-y-6">
        {fields.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">Required Fields</h4>
            </div>
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Field</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Required</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {fields.map((field: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{field.field_name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {field.data_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {field.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {field.is_required ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
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
            <div className="flex items-center gap-2 mb-3">
              <FileJson className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-semibold text-gray-900">Calculated Fields</h4>
            </div>
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Field</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Formula</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {calculatedFields.map((field: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{field.field_name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                          {field.formula}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
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
      <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto shadow-inner">
        <pre className="text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto">
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
    <Card className="shadow-lg border-gray-200">
      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Generated Schemas
          </CardTitle>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button 
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-white shadow-sm' : ''}
            >
              <Table className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button 
              variant={viewMode === 'json' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('json')}
              className={viewMode === 'json' ? 'bg-white shadow-sm' : ''}
            >
              <Code className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue={sheetSchemas[0]?.sheetId?.toString() || "consolidated"} className="w-full">
          <div className="mb-6">
            <TabsList className="flex flex-wrap w-full gap-1 bg-gray-100/50 p-2 h-auto">
              {sheetSchemas.map((schema: any) => {
                const sheet = sheets?.find((s: any) => s.id === schema.sheetId);
                return (
                  <TabsTrigger 
                    key={schema.sheetId} 
                    value={schema.sheetId.toString()}
                    className="text-xs px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    {sheet?.sheetName || `Sheet ${schema.sheetId}`}
                  </TabsTrigger>
                );
              })}
              {consolidatedSchema && (
                <TabsTrigger 
                  value="consolidated"
                  className="text-xs px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {schema.schemaData.required_fields?.length || 0} fields
                      </Badge>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {schema.aiConfidence}% confidence
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopySchema(schema)}
                        className="h-9 px-3 hover:bg-white"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleExportSchema(schema)}
                        className="h-9 px-3 hover:bg-white"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg overflow-hidden shadow-sm">
                    {viewMode === 'table' ? renderTableView(schema) : renderJsonView(schema)}
                  </div>
                </div>
              </TabsContent>
            );
          })}

          {consolidatedSchema && (
            <TabsContent value="consolidated" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                      Consolidated View
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      {consolidatedSchema.aiConfidence}% confidence
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleCopySchema(consolidatedSchema)}
                      className="h-9 px-3 hover:bg-white"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleExportSchema(consolidatedSchema)}
                      className="h-9 px-3 hover:bg-white"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg overflow-hidden shadow-sm">
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