import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Clock, Loader2 } from "lucide-react";

interface ProcessingStatusProps {
  templateId: number;
}

export function ProcessingStatus({ templateId }: ProcessingStatusProps) {
  const { data: statuses } = useQuery({
    queryKey: ["/api/templates", templateId, "status"],
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  // Group statuses by step and get the latest one for each step
  const latestStatuses = statuses?.reduce((acc: any[], status: any) => {
    const existingIndex = acc.findIndex(s => s.step === status.step);
    if (existingIndex === -1) {
      acc.push(status);
    } else {
      // Replace with newer status based on ID (higher ID = more recent)
      if (status.id > acc[existingIndex].id) {
        acc[existingIndex] = status;
      }
    }
    return acc;
  }, []) || [];

  // Define the order of steps
  const stepOrder = ["upload", "extraction", "ai_processing", "schema_generation"];
  
  // Sort by predefined order
  const sortedStatuses = latestStatuses.sort((a, b) => {
    const aIndex = stepOrder.indexOf(a.step);
    const bIndex = stepOrder.indexOf(b.step);
    return aIndex - bIndex;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-white" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-white animate-spin" />;
      case "failed":
        return <span className="text-white text-sm">✕</span>;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStepLabel = (step: string) => {
    switch (step) {
      case "upload":
        return "File Upload";
      case "extraction":
        return "Sheet Extraction";
      case "ai_processing":
        return "AI Processing";
      case "schema_generation":
        return "Schema Generation";
      default:
        return step;
    }
  };

  const getStepDescription = (step: string, status: string, message?: string) => {
    if (message) return message;
    
    switch (step) {
      case "upload":
        return status === "completed" ? "File uploaded successfully" : "Uploading file...";
      case "extraction":
        return status === "completed" ? "Data extraction completed" : "Extracting data from sheets...";
      case "ai_processing":
        return status === "completed" ? "AI analysis completed" : "Analyzing data patterns with Gemini AI...";
      case "schema_generation":
        return status === "completed" ? "Schema generation completed" : "Schema generation in progress...";
      default:
        return `${step} ${status}`;
    }
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (sortedStatuses.length === 0) return 0;
    
    const completedSteps = sortedStatuses.filter(s => s.status === "completed").length;
    const inProgressSteps = sortedStatuses.filter(s => s.status === "in_progress").length;
    const totalSteps = sortedStatuses.length; // Use actual steps present, not theoretical max
    
    // If all available steps are completed, show 100%
    if (completedSteps === totalSteps && inProgressSteps === 0) {
      return 100;
    }
    
    // If there are in-progress steps, calculate partial progress
    if (inProgressSteps > 0) {
      const inProgressStep = sortedStatuses.find(s => s.status === "in_progress");
      const stepProgress = inProgressStep?.progress || 0;
      const baseProgress = (completedSteps / totalSteps) * 100;
      const currentStepProgress = (stepProgress / 100) * (100 / totalSteps);
      return Math.min(100, baseProgress + currentStepProgress);
    }
    
    // Calculate based on completed steps out of total present steps
    return (completedSteps / totalSteps) * 100;
  };

  const overallProgress = calculateOverallProgress();
  const hasAnyInProgress = sortedStatuses.some(s => s.status === "in_progress");
  const allCompleted = sortedStatuses.length > 0 && sortedStatuses.every(s => s.status === "completed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Processing Status</CardTitle>
        {sortedStatuses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {allCompleted ? "Processing Complete!" : hasAnyInProgress ? "Processing..." : "Ready"}
              </span>
              <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedStatuses.length > 0 ? (
            sortedStatuses.map((status: any) => (
              <div key={status.id} className="flex items-center">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getStatusColor(status.status)}`}>
                  {getStatusIcon(status.status)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${status.status === "completed" ? "text-gray-900" : status.status === "failed" ? "text-red-600" : "text-gray-900"}`}>
                    {getStepLabel(status.step)} {status.status === "completed" ? "Complete" : status.status === "failed" ? "Failed" : ""}
                  </p>
                  <p className={`text-xs ${status.status === "completed" ? "text-gray-500" : status.status === "failed" ? "text-red-500" : "text-gray-500"}`}>
                    {getStepDescription(status.step, status.status, status.message)}
                  </p>
                  {status.progress > 0 && status.status === "in_progress" && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No processing status available yet.</p>
              <p className="text-gray-400 text-xs mt-2">Processing will start automatically when a template is uploaded.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
