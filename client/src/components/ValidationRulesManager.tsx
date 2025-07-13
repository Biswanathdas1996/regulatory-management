import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ValidationRulesManagerProps {
  templateId: number;
  sheets?: any[];
}

export function ValidationRulesManager({ templateId }: ValidationRulesManagerProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Validation Rules
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValidationUploadDialog(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload Validation File
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Validation Rules Management</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload validation files to configure rules for this template
          </p>
        </div>
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
                accept=".txt,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setValidationFile(file);
                }}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload a TXT or Excel file containing validation rules for this template
              </p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Supported Formats:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>TXT files:</strong> Custom validation rules format</li>
                <li>• <strong>Excel files:</strong> Structured rules with columns</li>
                <li>• Rules will be automatically parsed and saved</li>
                <li>• Template will be marked as "with rules"</li>
              </ul>
            </div>
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