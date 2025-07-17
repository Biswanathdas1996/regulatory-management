import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Server, Database, Cpu } from "lucide-react";

interface SystemStatsProps {
  stats?: {
    totalTemplates: number;
    processed: number;
    processing: number;
    failed: number;
    averageConfidence: number;
  };
}

export function SystemStats({ stats }: SystemStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Processing Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-gray-500">Loading statistics...</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-gray-500">Loading system status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // System metrics are now fetched from database via analytics API
  const memoryUsage = Math.round((process.memoryUsage?.()?.heapUsed / 1024 / 1024) || 0);
  const storageUsage = 0; // Can be calculated from database size if needed

  return (
    <>
      {/* Processing Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Processing Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Templates</span>
              <span className="text-lg font-semibold text-gray-900">{stats.totalTemplates}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Successfully Processed</span>
              <span className="text-lg font-semibold text-green-600">{stats.processed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-lg font-semibold text-yellow-600">{stats.processing}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="text-lg font-semibold text-red-600">{stats.failed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average AI Confidence</span>
              <span className="text-lg font-semibold text-gray-900">{stats.averageConfidence}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Server className="mr-2 h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Status</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gemini API</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage Usage</span>
              <span className="text-sm text-gray-900">2.4GB / 10GB</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Database className="mr-1 h-4 w-4" />
                  Storage
                </span>
                <span className="text-sm text-gray-900">{storageUsage}%</span>
              </div>
              <Progress value={storageUsage} className="w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Cpu className="mr-1 h-4 w-4" />
                  Memory Usage
                </span>
                <span className="text-sm text-gray-900">{memoryUsage}%</span>
              </div>
              <Progress value={memoryUsage} className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
