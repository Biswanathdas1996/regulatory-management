import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, AlertCircle, FileCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XBRLReportGeneratorProps {
  submission: any;
  onReportGenerated: (reportUrl: string) => void;
}

export function XBRLReportGenerator({ submission, onReportGenerated }: XBRLReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const response = await fetch(`/api/submissions/${submission.id}/generate-xbrl-report`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate XBRL report');
      }

      const result = await response.json();
      setReportUrl(result.downloadUrl);
      onReportGenerated(result.downloadUrl);
      
      toast({
        title: 'Report Generated',
        description: 'XBRL report has been generated successfully',
      });
    } catch (error) {
      console.error('Report generation error:', error);
      setGenerationError('Failed to generate XBRL report. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to generate XBRL report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          XBRL Report Generation
        </CardTitle>
        <CardDescription>
          Generate standardized XBRL reports for regulatory compliance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submission Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Submission Details</h4>
            <Badge variant={submission.status === 'passed' ? 'default' : 'destructive'}>
              {submission.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">File Name:</p>
              <p className="font-medium">{submission.fileName}</p>
            </div>
            <div>
              <p className="text-gray-600">Reporting Period:</p>
              <p className="font-medium">{submission.reportingPeriod}</p>
            </div>
            <div>
              <p className="text-gray-600">File Size:</p>
              <p className="font-medium">{(submission.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <p className="text-gray-600">Submitted:</p>
              <p className="font-medium">{new Date(submission.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Report Generation Status */}
        {isGenerating && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">Generating XBRL report...</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              This may take a few moments depending on the file size.
            </p>
          </div>
        )}

        {/* Generation Error */}
        {generationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{generationError}</span>
            </div>
          </div>
        )}

        {/* Report Ready */}
        {reportUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">Report Generated Successfully</span>
            </div>
            <p className="text-xs text-green-600 mb-3">
              Your XBRL report is ready for download. The report includes all validated data 
              in standard XBRL format for regulatory submission.
            </p>
            <Button variant="outline" size="sm" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        )}

        {/* Generate Button */}
        {!reportUrl && (
          <div className="flex justify-center">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || submission.status !== 'passed'}
              className="min-w-40"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        )}

        {/* Requirements Note */}
        {submission.status !== 'passed' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Report generation is only available for submissions that have passed validation.
              </span>
            </div>
          </div>
        )}

        {/* Report Info */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">About XBRL Reports</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Generated reports comply with XBRL 2.1 specification</p>
            <p>• Reports include all taxonomy-compliant data elements</p>
            <p>• Suitable for regulatory submission and audit requirements</p>
            <p>• Reports are digitally signed and timestamped</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}