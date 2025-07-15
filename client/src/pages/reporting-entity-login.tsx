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
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ReportingEntityLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login, logout, isLoading, isReportingEntity, isAuthenticated, user } =
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
      if (isReportingEntity) {
        toast({
          title: "Login successful",
          description: `Welcome to your ${user.category} reporting dashboard`,
        });
        setLocation("/reporting-entity/dashboard");
      } else {
        // User logged in but not reporting entity - logout and show error
        toast({
          title: "Access denied",
          description: "Reporting Entity access required",
          variant: "destructive",
        });
        logout();
      }
    }
  }, [isAuthenticated, isReportingEntity, user, toast, setLocation, logout]);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-full">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reporting Entity Portal
          </h1>
          <p className="text-gray-600">
            Submit and manage your regulatory reports
          </p>
        </div>

        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-green-800">
              Reporting Entity Login
            </CardTitle>
            <CardDescription>
              Access your submission portal to upload and track regulatory
              reports
            </CardDescription>
            <div className="flex justify-center gap-2 mt-3">
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-200"
              >
                Banking
              </Badge>
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-200"
              >
                NBFC
              </Badge>
              <Badge
                variant="outline"
                className="text-purple-600 border-purple-200"
              >
                Stock Exchange
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Entity Username</Label>
                <Input
                  id="username"
                  placeholder="Enter entity username"
                  {...form.register("username")}
                  className="focus:border-green-500 focus:ring-green-500"
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
                    className="pr-10 focus:border-green-500 focus:ring-green-500"
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
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In to Submit Reports"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">Administrative access:</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/super-admin/login")}
                  className="text-red-600 hover:text-red-700"
                >
                  IFSCA Login
                </Button>
                <span className="text-gray-400">•</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/ifsca/login")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  IFSCA User Login
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
