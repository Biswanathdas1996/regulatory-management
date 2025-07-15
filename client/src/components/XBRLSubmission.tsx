import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, AlertCircle, Download, FileCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XBRLSubmissionProps {
  templates: any[];
  onSubmissionSuccess: (submission: any) => void;
  userId: number;
}

export function XBRLSubmission({ templates, onSubmissionSuccess, userId }: XBRLSubmissionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportingPeriod, setReportingPeriod] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xbrlStructure, setXbrlStructure] = useState<any>(null);
  const { toast } = useToast();

  // Filter XBRL templates
  const xbrlTemplates = templates.filter(template => template.isXBRL);

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
        setValidationResult(null);
      }
    },
  });

  const handleTemplateSelect = async (templateId: string) => {
    const template = xbrlTemplates.find(t => t.id === parseInt(templateId));
    setSelectedTemplate(template);
    
    // Load XBRL structure for guidance
    try {
      const response = await fetch(`/api/templates/${templateId}/xbrl-structure`);
      if (response.ok) {
        const structure = await response.json();
        setXbrlStructure(structure);
      }
    } catch (error) {
      console.error('Failed to load XBRL structure:', error);
    }
  };

  const handleValidateFile = async () => {
    if (!uploadedFile || !selectedTemplate) return;

    setIsValidating(true);
    
    try {
      // First, create a temporary submission
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('templateId', selectedTemplate.id.toString());
      formData.append('reportingPeriod', reportingPeriod);

      const submitResponse = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to create submission');
      }

      const submission = await submitResponse.json();

      // Now validate the XBRL
      const validateResponse = await fetch(`/api/submissions/${submission.id}/validate-xbrl`, {
        method: 'POST',
      });

      if (!validateResponse.ok) {
        throw new Error('XBRL validation failed');
      }

      const validation = await validateResponse.json();
      setValidationResult(validation);
      
      if (validation.isValid) {
        toast({
          title: 'Validation Successful',
          description: 'Your XBRL file is valid and ready for submission',
        });
      } else {
        toast({
          title: 'Validation Issues Found',
          description: `Found ${validation.errors.length} errors and ${validation.warnings.length} warnings`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate XBRL file',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !selectedTemplate || !reportingPeriod) return;

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('templateId', selectedTemplate.id.toString());
      formData.append('reportingPeriod', reportingPeriod);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit XBRL file');
      }

      const submission = await response.json();
      
      toast({
        title: 'Success',
        description: 'XBRL file submitted successfully',
      });

      onSubmissionSuccess(submission);
      
      // Reset form
      setUploadedFile(null);
      setSelectedTemplate(null);
      setReportingPeriod('');
      setValidationResult(null);
      setXbrlStructure(null);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit XBRL file',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = uploadedFile && selectedTemplate && reportingPeriod && 
                   (validationResult?.isValid || validationResult === null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit XBRL Document
          </CardTitle>
          <CardDescription>
            Upload your completed XBRL instance document for validation and submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template-select">Select XBRL Template</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an XBRL template" />
              </SelectTrigger>
              <SelectContent>
                {xbrlTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">XBRL</Badge>
                      <span>{template.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reporting Period */}
          <div className="space-y-2">
            <Label htmlFor="reporting-period">Reporting Period</Label>
            <Select value={reportingPeriod} onValueChange={setReportingPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select reporting period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1-2024">Q1 2024</SelectItem>
                <SelectItem value="Q2-2024">Q2 2024</SelectItem>
                <SelectItem value="Q3-2024">Q3 2024</SelectItem>
                <SelectItem value="Q4-2024">Q4 2024</SelectItem>
                <SelectItem value="Annual-2024">Annual 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* XBRL Structure Guide */}
          {xbrlStructure && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">XBRL Template Structure</CardTitle>
                <CardDescription>
                  This template contains the following concepts and requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Concepts</p>
                    <p className="text-xl font-bold text-blue-600">
                      {xbrlStructure.concepts?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Namespace</p>
                    <p className="text-sm text-gray-600 font-mono">
                      {xbrlStructure.namespace || 'Standard XBRL'}
                    </p>
                  </div>
                </div>
                
                {xbrlStructure.concepts && xbrlStructure.concepts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Concepts:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {xbrlStructure.concepts.slice(0, 6).map((concept: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                          <span className="font-medium">{concept.name}</span>
                          {concept.type && (
                            <span className="text-gray-500 ml-1">({concept.type})</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {xbrlStructure.concepts.length > 6 && (
                      <p className="text-xs text-gray-500 mt-2">
                        ... and {xbrlStructure.concepts.length - 6} more concepts
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload XBRL Instance Document</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              {isDragActive ? (
                <p className="text-sm text-blue-600">Drop your XBRL file here...</p>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Drag & drop your XBRL file here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: .xml, .xbrl files
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded File Display */}
          {uploadedFile && (
            <div className="p-4 bg-gray-50 rounded-lg">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleValidateFile}
                    disabled={isValidating || !selectedTemplate}
                  >
                    {isValidating ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Validating...</span>
                      </div>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4 mr-1" />
                        Validate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationResult.isValid ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✓ XBRL file is valid</p>
                    <p className="text-sm text-green-600">
                      Your XBRL instance document passes all validation checks and is ready for submission.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {validationResult.errors.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">
                          Errors ({validationResult.errors.length})
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {validationResult.errors.map((error: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">
                          Warnings ({validationResult.warnings.length})
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {validationResult.warnings.map((warning: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit XBRL
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">XBRL Submission Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Select Template</h3>
                <p className="text-sm text-gray-600">
                  Choose the XBRL template that matches your reporting requirements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Prepare XBRL Instance</h3>
                <p className="text-sm text-gray-600">
                  Use XBRL software to create your instance document with the required data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Validate & Submit</h3>
                <p className="text-sm text-gray-600">
                  Upload your XBRL file, validate it against the taxonomy, and submit for processing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}