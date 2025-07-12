import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; role: string }) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.username}!`,
      });
      
      // Store auth data
      login(data.user, data.token);
      
      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuickLogin = (username: string, role: string) => {
    loginMutation.mutate({ username, role });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Template Validation System</h1>
          <p className="mt-2 text-gray-600">Choose a demo account to login</p>
        </div>

        <div className="space-y-4">
          {/* Admin Login */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => handleQuickLogin("admin", "admin")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Login
              </CardTitle>
              <CardDescription>
                Access template management, view all submissions, and approve/reject reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login as Admin"}
              </Button>
            </CardContent>
          </Card>

          {/* User Login */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => handleQuickLogin("user", "user")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Login
              </CardTitle>
              <CardDescription>
                Submit forms, track submissions, and view validation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="secondary"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login as User"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-gray-500">
          This is a demo system. Click on any card to login instantly.
        </p>
      </div>
    </div>
  );
}