import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import AuthDebugPanel from "@/components/AuthDebugPanel";

export default function AuthTestPage() {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Authentication Test Page
          </h1>
          <p className="text-gray-600">
            Use this page to verify that authentication context and session are
            working correctly
          </p>
        </div>

        {/* Debug Panel */}
        <AuthDebugPanel />

        {/* Instructions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">
            How to Test Authentication
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                1. Test Super Admin Login
              </h3>
              <p className="text-gray-600 text-sm">
                Go to <code>/super-admin/login</code> and login with super admin
                credentials. After successful login, you should be redirected
                here automatically.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                2. Verify Session State
              </h3>
              <p className="text-gray-600 text-sm">
                Check that all fields in the debug panel above show correct
                information: authentication status, user details, role
                permissions, and session storage.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                3. Test Session Persistence
              </h3>
              <p className="text-gray-600 text-sm">
                Refresh this page (F5) and verify that you remain logged in and
                all data persists.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                4. Test Access Control
              </h3>
              <p className="text-gray-600 text-sm">
                Try logging in with non-super-admin credentials to verify that
                access is denied properly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
