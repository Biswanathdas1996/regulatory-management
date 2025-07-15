import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, User, Shield, Settings } from "lucide-react";

/**
 * Debug component to verify auth context and session state
 * Use this component to check if authentication is working properly
 */
export default function AuthDebugPanel() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isSuperAdmin,
    isIFSCAUser,
    isReportingEntity,
    isAdmin,
  } = useAuth();

  // Check localStorage for stored user data
  const storedUser = localStorage.getItem("user");
  let parsedStoredUser = null;
  try {
    parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing stored user:", error);
  }

  const StatusIcon = ({ condition }: { condition: boolean }) =>
    condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Authentication Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Loading State:</span>
          <Badge variant={isLoading ? "secondary" : "outline"}>
            {isLoading ? "Loading..." : "Ready"}
          </Badge>
        </div>

        {/* Authentication Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Authenticated:</span>
          <div className="flex items-center gap-2">
            <StatusIcon condition={isAuthenticated} />
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        {/* User Information */}
        {user && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">ID</div>
                <div className="font-medium">{user.id}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Username</div>
                <div className="font-medium">{user.username}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Role</div>
                <div className="font-medium">{user.role}</div>
              </div>
              {user.category && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-medium">{user.category}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Role Permissions */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Permissions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>IFSCA:</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={isSuperAdmin} />
                <Badge variant={isSuperAdmin ? "default" : "outline"}>
                  {isSuperAdmin ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>IFSCA User:</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={isIFSCAUser} />
                <Badge variant={isIFSCAUser ? "default" : "outline"}>
                  {isIFSCAUser ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Reporting Entity:</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={isReportingEntity} />
                <Badge variant={isReportingEntity ? "default" : "outline"}>
                  {isReportingEntity ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Admin (Legacy):</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={isAdmin} />
                <Badge variant={isAdmin ? "default" : "outline"}>
                  {isAdmin ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* localStorage Check */}
        <div className="space-y-3">
          <h3 className="font-semibold">Session Storage</h3>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">localStorage Data:</div>
            <div className="bg-white p-2 rounded border overflow-auto max-h-32">
              <pre className="text-xs">
                {parsedStoredUser
                  ? JSON.stringify(parsedStoredUser, null, 2)
                  : "No user data in localStorage"}
              </pre>
            </div>
          </div>
        </div>

        {/* Session Verification */}
        <div className="space-y-3">
          <h3 className="font-semibold">Session Verification</h3>
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Context User Matches localStorage:
              </span>
              <StatusIcon
                condition={
                  user &&
                  parsedStoredUser &&
                  user.id === parsedStoredUser.id &&
                  user.username === parsedStoredUser.username &&
                  user.role === parsedStoredUser.role
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Session Active:</span>
              <StatusIcon condition={isAuthenticated && !!user} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ready for Navigation:</span>
              <StatusIcon condition={!isLoading && isAuthenticated} />
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">
            Testing Instructions:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. Check that "Authenticated" shows "Yes" after login</li>
            <li>2. Verify user information is populated correctly</li>
            <li>3. Confirm role permissions match expected access level</li>
            <li>4. Ensure localStorage data matches context data</li>
            <li>5. Check that session persists after page refresh</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
