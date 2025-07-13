import React, { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireUser?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireUser = false,
  redirectTo,
}) => {
  const { isAuthenticated, isAdmin, isUser, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirements
  if (requireAuth && !isAuthenticated) {
    setLocation(redirectTo || "/");
    return null;
  }

  // Check admin requirements
  if (requireAdmin && !isAdmin) {
    setLocation(redirectTo || "/admin-login");
    return null;
  }

  // Check user requirements
  if (requireUser && !isUser) {
    setLocation(redirectTo || "/user-login");
    return null;
  }

  return <>{children}</>;
};

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => (
  <ProtectedRoute requireAuth requireAdmin redirectTo="/admin-login">
    {children}
  </ProtectedRoute>
);

interface UserRouteProps {
  children: ReactNode;
}

export const UserRoute: React.FC<UserRouteProps> = ({ children }) => (
  <ProtectedRoute requireAuth requireUser redirectTo="/user-login">
    {children}
  </ProtectedRoute>
);

interface PublicRouteProps {
  children: ReactNode;
  redirectIfAuthenticated?: boolean;
  adminRedirectTo?: string;
  userRedirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = false,
  adminRedirectTo = "/admin-dashboard",
  userRedirectTo = "/user-dashboard",
}) => {
  const { isAuthenticated, isAdmin, isUser, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users if specified
  if (redirectIfAuthenticated && isAuthenticated) {
    if (isAdmin) {
      setLocation(adminRedirectTo);
    } else if (isUser) {
      setLocation(userRedirectTo);
    }
    return null;
  }

  return <>{children}</>;
};
