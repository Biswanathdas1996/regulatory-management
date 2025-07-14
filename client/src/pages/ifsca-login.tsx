import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function IFSCALogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.role === "ifsca_user") {
        toast({
          title: "Login successful",
          description: `Welcome to IFSCA ${data.category} Console`,
        });
        setLocation("/ifsca/dashboard");
      } else {
        toast({
          title: "Access denied",
          description: "IFSCA User access required",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">IFSCA User Console</h1>
          <p className="text-gray-600">Category-level administration portal</p>
        </div>

        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-blue-800">IFSCA Administrator Login</CardTitle>
            <CardDescription>
              Access your category-specific regulatory management console
            </CardDescription>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-blue-600 border-blue-200">Banking</Badge>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">NBFC</Badge>
              <Badge variant="outline" className="text-purple-600 border-purple-200">Stock Exchange</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">IFSCA Username</Label>
                <Input
                  id="username"
                  placeholder="Enter IFSCA username"
                  {...form.register("username")}
                  className="focus:border-blue-500 focus:ring-blue-500"
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
                    className="pr-10 focus:border-blue-500 focus:ring-blue-500"
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
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In to IFSCA Console"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">Other access levels:</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/super-admin/login")}
                  className="text-red-600 hover:text-red-700"
                >
                  Super Admin Login
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