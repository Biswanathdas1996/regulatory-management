import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Download, 
  FileCheck, 
  Info,
  ExternalLink,
  FileJson,
  FileCode,
  FileSpreadsheet,
  Code
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ValidationRulesManagerProps {
  templateId: number;
  template?: any;
  sheets?: any[];
}

export function ValidationRulesManager({ templateId, template }: ValidationRulesManagerProps) {
  const { toast } = useToast();
  const [showValidationUploadDialog, setShowValidationUploadDialog] = useState(false);
  const [validationFile, setValidationFile] = useState<File | null>(null);

  // Upload validation file mutation
  const uploadValidationFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('validationFile', file);
      
      const response = await fetch(`/api/templates/${templateId}/validation-file`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload validation file");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}`] });
      toast({ 
        title: "Success", 
        description: data.warning || `Validation file uploaded successfully. ${data.rulesCreated} rules created.`
      });
      setShowValidationUploadDialog(false);
      setValidationFile(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Download validation file function
  const downloadValidationFile = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}/validation-file/download`);
      if (!response.ok) {
        throw new Error('Failed to download validation file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Extract filename from validation rules path
      const filename = template?.validationRulesPath?.split('/').pop() || 'validation-rules.txt';
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: "Validation file downloaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download validation file", variant: "destructive" });
    }
  };

  // Download template function
  const handleDownloadTemplate = async (format: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/validation-template?format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to download validation template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename based on format
      const extensions = {
        json: 'json',
        yaml: 'yaml',
        csv: 'csv',
        excel: 'xlsx',
        txt: 'txt'
      };
      const extension = extensions[format] || 'txt';
      a.download = `${template?.name || 'template'}-validation-rules.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ 
        title: "Success", 
        description: `${format.toUpperCase()} validation template downloaded successfully` 
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to download validation template", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Validation Rules
          </CardTitle>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download Template
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDownloadTemplate('json')}>
                  <FileJson className="h-4 w-4 mr-2" />
                  JSON Schema Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadTemplate('yaml')}>
                  <FileCode className="h-4 w-4 mr-2" />
                  YAML Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadTemplate('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadTemplate('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadTemplate('txt')}>
                  <FileText className="h-4 w-4 mr-2" />
                  TXT Template (Legacy)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValidationUploadDialog(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload Validation File
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {template?.validationFileUploaded && template?.validationRulesPath ? (
          <div className="space-y-4">
            {/* Uploaded File Display */}
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileCheck className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Validation File Uploaded</h3>
                  <p className="text-sm text-green-700">
                    {template.validationRulesPath.split('/').pop()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Active Rules
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadValidationFile}
                  className="text-green-700 border-green-300 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            
            {/* Upload New File Section */}
            <div className="text-center py-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Want to update the validation rules?
              </p>
              <Button
                variant="outline"
                onClick={() => setShowValidationUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Validation File
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900">Validation Rules Management</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Upload validation files to configure rules for this template
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Need help creating validation rules?
                </p>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Download a pre-filled validation template with your template's sheet structure. 
                Simply add your validation rules and upload it back!
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('json')}>
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON Schema Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('yaml')}>
                    <FileCode className="h-4 w-4 mr-2" />
                    YAML Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('csv')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('txt')}>
                    <FileText className="h-4 w-4 mr-2" />
                    TXT Template (Legacy)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </CardContent>

      {/* Validation File Upload Dialog */}
      <Dialog open={showValidationUploadDialog} onOpenChange={setShowValidationUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Validation File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="validation-file">Select Validation File</Label>
              <Input
                id="validation-file"
                type="file"
                accept=".json,.yaml,.yml,.csv,.xlsx,.xls,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setValidationFile(file);
                }}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload validation rules in JSON Schema, YAML, CSV, Excel, or TXT format
              </p>
            </div>
            
            {/* Format Guide */}
            <Tabs defaultValue="json" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="json" className="flex items-center gap-1">
                  <FileJson className="h-3 w-3" />
                  JSON
                </TabsTrigger>
                <TabsTrigger value="yaml" className="flex items-center gap-1">
                  <FileCode className="h-3 w-3" />
                  YAML
                </TabsTrigger>
                <TabsTrigger value="csv" className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  CSV
                </TabsTrigger>
                <TabsTrigger value="excel" className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel
                </TabsTrigger>
                <TabsTrigger value="txt" className="flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  TXT
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="json" className="mt-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileJson className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-medium">JSON Schema (Recommended)</h4>
                    <Badge variant="outline" className="text-xs">Industry Standard</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Most comprehensive format following JSON Schema Draft 2020-12
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>• Comprehensive validation capabilities</div>
                    <div>• Supports complex expressions and cross-field validation</div>
                    <div>• Excellent tooling support</div>
                    <div>• Metadata and version control</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.open('/validation/examples/quarterly-report-validation.json', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Example
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="yaml" className="mt-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode className="h-4 w-4 text-green-600" />
                    <h4 className="text-sm font-medium">YAML Configuration</h4>
                    <Badge variant="outline" className="text-xs">Human-Readable</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Human-readable format with comments and structured layout
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>• Clean, readable syntax</div>
                    <div>• Supports comments and documentation</div>
                    <div>• Same capabilities as JSON Schema</div>
                    <div>• Popular in DevOps and configuration</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.open('/validation/examples/quarterly-report-validation.yaml', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Example
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="csv" className="mt-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="h-4 w-4 text-orange-600" />
                    <h4 className="text-sm font-medium">CSV Format</h4>
                    <Badge variant="outline" className="text-xs">Simple</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Simple tabular format for basic validation rules
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>• Easy to generate programmatically</div>
                    <div>• Universal support across tools</div>
                    <div>• Good for bulk rule import</div>
                    <div>• Limited to basic validations</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.open('/validation/examples/quarterly-report-validation.csv', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Example
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="excel" className="mt-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <h4 className="text-sm font-medium">Excel Format</h4>
                    <Badge variant="outline" className="text-xs">Business-Friendly</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Structured workbook format with multiple sheets for different rule types
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>• Familiar interface for business users</div>
                    <div>• Structured with Metadata, Column Validations, and Cross-Field sheets</div>
                    <div>• Easy to review and modify</div>
                    <div>• Supports bulk rule management</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => alert('Excel template will be downloadable soon')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Template
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="txt" className="mt-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4 text-gray-600" />
                    <h4 className="text-sm font-medium">TXT Format (Legacy)</h4>
                    <Badge variant="outline" className="text-xs">Legacy Support</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Simple text format for backward compatibility
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>• Simple field:condition format</div>
                    <div>• Backward compatibility</div>
                    <div>• Limited validation capabilities</div>
                    <div>• Consider upgrading to JSON Schema</div>
                  </div>
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <Info className="h-3 w-3 inline mr-1" />
                      TXT format is deprecated. Use JSON Schema for new projects.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowValidationUploadDialog(false);
                  setValidationFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => validationFile && uploadValidationFileMutation.mutate(validationFile)}
                disabled={!validationFile || uploadValidationFileMutation.isPending}
              >
                {uploadValidationFileMutation.isPending ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}