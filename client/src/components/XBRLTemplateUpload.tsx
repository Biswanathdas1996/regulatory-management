import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XBRLTemplateUploadProps {
  onUploadSuccess: (template: any) => void;
  userCategory: string;
  userId: number;
}

export function XBRLTemplateUpload({ onUploadSuccess, userCategory, userId }: XBRLTemplateUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [xbrlStructure, setXbrlStructure] = useState<any>(null);
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'application/xbrl+xml': ['.xbrl'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        handleXBRLUpload(acceptedFiles[0]);
      }
    },
  });

  const handleXBRLUpload = async (file: File) => {
    setIsUploading(true);
    setProcessingStatus('Uploading XBRL template...');
    
    try {
      const formData = new FormData();
      formData.append('template', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('category', userCategory);
      formData.append('frequency', 'quarterly');
      formData.append('isXBRL', 'true');
      formData.append('templateType', 'xbrl');

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload XBRL template');
      }

      const result = await response.json();
      setProcessingStatus('Parsing XBRL structure...');
      
      // Parse XBRL structure
      const parseResponse = await fetch(`/api/templates/${result.id}/parse-xbrl`, {
        method: 'POST',
      });

      if (parseResponse.ok) {
        const xbrlData = await parseResponse.json();
        setXbrlStructure(xbrlData);
        setProcessingStatus('XBRL template processed successfully!');
        
        toast({
          title: 'Success',
          description: 'XBRL template uploaded and processed successfully',
        });
        
        onUploadSuccess(result);
      } else {
        setProcessingStatus('XBRL template uploaded but parsing failed');
        toast({
          title: 'Partial Success',
          description: 'Template uploaded but XBRL parsing failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('XBRL upload error:', error);
      setProcessingStatus('Upload failed');
      toast({
        title: 'Error',
        description: 'Failed to upload XBRL template',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setProcessingStatus('');
    setXbrlStructure(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload XBRL Template
          </CardTitle>
          <CardDescription>
            Upload an XBRL taxonomy file (.xml or .xbrl) to create a new template.
            The system will automatically extract the structure and create validation rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">
                Drop your XBRL file here...
              </p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag & drop your XBRL file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports: .xml, .xbrl files
                </p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">XBRL</Badge>
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-600">Processing...</span>
                    </div>
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            </div>
          )}

          {processingStatus && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800">{processingStatus}</span>
              </div>
            </div>
          )}

          {xbrlStructure && (
            <div className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">XBRL Structure Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Total Concepts</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {xbrlStructure.concepts?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Validation Rules</p>
                      <p className="text-2xl font-bold text-green-600">
                        {xbrlStructure.validationRules?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-800">Template Ready!</h3>
                </div>
                <p className="text-sm text-green-700">
                  Your XBRL template has been processed and is ready for use. 
                  Users can now download the template, fill it with data, and submit for validation.
                </p>
              </div>
            </div>
          )}

          {uploadedFile && !isUploading && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={resetUpload}>
                Upload Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">XBRL Template Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Upload XBRL Template</h3>
                <p className="text-sm text-gray-600">
                  Upload your XBRL taxonomy file (.xml or .xbrl). The system will automatically 
                  extract the structure and create validation rules.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Users Download & Fill</h3>
                <p className="text-sm text-gray-600">
                  Reporting entities can download the template, fill it with their data 
                  using any XBRL software, and prepare their instance documents.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Submit & Validate</h3>
                <p className="text-sm text-gray-600">
                  Users submit their filled XBRL instance documents. The system validates 
                  against the taxonomy and generates compliance reports.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Generate Reports</h3>
                <p className="text-sm text-gray-600">
                  After validation, the system generates standardized XBRL reports 
                  for regulatory compliance and submission.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}