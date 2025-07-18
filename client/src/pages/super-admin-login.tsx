import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function SuperAdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login, logout, isLoading, isSuperAdmin, isAuthenticated, user } =
    useAuth();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check auth status after login attempt
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isSuperAdmin) {
        toast({
          title: "Login successful",
          description: "Welcome to IFSCA Dashboard",
        });
        // Redirect to super admin dashboard
        setLocation("/super-admin/dashboard");
      } else {
        // User logged in but not super admin - logout and show error
        toast({
          title: "Access denied",
          description: "IFSCA access required",
          variant: "destructive",
        });
        logout();
      }
    }
  }, [isAuthenticated, isSuperAdmin, user, toast, setLocation, logout]);

  const onSubmit = async (data: LoginForm) => {
    try {
      await login({ username: data.username, password: data.password });
      // The useEffect above will handle the redirect or error after login
    } catch (error) {
      // Error handling is done in the auth context
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-red-600 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">IFSCA Portal</h1>
          <p className="text-gray-600">Global system administration access</p>
        </div>

        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-red-800">
              IFSCA Administrator Login
            </CardTitle>
            <CardDescription>
              Enter your super IFSCA credentials to access the global management
              console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">IFSCA Username</Label>
                <Input
                  id="username"
                  placeholder="Enter super admin username"
                  {...form.register("username")}
                  className="focus:border-red-500 focus:ring-red-500"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    {...form.register("password")}
                    className="pr-10 focus:border-red-500 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In as IFSCA Admin"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">Other access levels:</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/regulator/login")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Regulator Login
                </Button>
                <span className="text-gray-400">•</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/reporting-entity/login")}
                  className="text-green-600 hover:text-green-700"
                >
                  Reporting Entity Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
