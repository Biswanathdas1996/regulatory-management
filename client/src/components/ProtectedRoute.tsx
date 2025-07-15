import React, { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireReportingEntity?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireReportingEntity = false,
  redirectTo,
}) => {
  const { isAuthenticated, isAdmin, isReportingEntity, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Use effect for navigation to avoid setState during render
  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirements
    if (requireAuth && !isAuthenticated) {
      setLocation(redirectTo || "/");
      return;
    }

    // Check admin requirements
    if (requireAdmin && !isAdmin) {
      setLocation(redirectTo || "/admin-login");
      return;
    }

    // Check reporting entity requirements
    if (requireReportingEntity && !isReportingEntity) {
      setLocation(redirectTo || "/reporting-entity/login");
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    isAdmin,
    isReportingEntity,
    requireAuth,
    requireAdmin,
    requireReportingEntity,
    redirectTo,
    setLocation,
  ]);

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

  // Don't render children if authentication checks fail
  if (requireAuth && !isAuthenticated) return null;
  if (requireAdmin && !isAdmin) return null;
  if (requireReportingEntity && !isReportingEntity) return null;

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

interface SuperAdminRouteProps {
  children: ReactNode;
}

export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({
  children,
}) => {
  const { isSuperAdmin, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setLocation("/super-admin/login");
      return;
    }

    if (!isSuperAdmin) {
      setLocation("/super-admin/login");
      return;
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, setLocation]);

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

  if (!isAuthenticated || !isSuperAdmin) return null;

  return <>{children}</>;
};

interface IFSCARouteProps {
  children: ReactNode;
}

export const IFSCARoute: React.FC<IFSCARouteProps> = ({ children }) => {
  const { isIFSCAUser, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setLocation("/ifsca/login");
      return;
    }

    if (!isIFSCAUser) {
      setLocation("/ifsca/login");
      return;
    }
  }, [isLoading, isAuthenticated, isIFSCAUser, setLocation]);

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

  if (!isAuthenticated || !isIFSCAUser) return null;

  return <>{children}</>;
};

interface ReportingEntityRouteProps {
  children: ReactNode;
}

export const ReportingEntityRoute: React.FC<ReportingEntityRouteProps> = ({
  children,
}) => {
  const { user, isReportingEntity, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setLocation("/reporting-entity/login");
      return;
    }

    if (!isReportingEntity) {
      setLocation("/reporting-entity/login");
      return;
    }
  }, [isLoading, isAuthenticated, isReportingEntity, setLocation]);

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

  if (!isAuthenticated || !isReportingEntity) return null;

  return <>{children}</>;
};

interface ReportingEntityRouteProps {
  children: ReactNode;
}

export const UserRoute: React.FC<ReportingEntityRouteProps> = ({
  children,
}) => <ReportingEntityRoute>{children}</ReportingEntityRoute>;

interface PublicRouteProps {
  children: ReactNode;
  redirectIfAuthenticated?: boolean;
  adminRedirectTo?: string;
  userRedirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = false,
}) => {
  const {
    isAuthenticated,
    isAdmin,
    isReportingEntity,
    isSuperAdmin,
    isIFSCAUser,
    isLoading,
  } = useAuth();
  const [, setLocation] = useLocation();

  // Use effect for navigation to avoid setState during render
  useEffect(() => {
    if (isLoading) return;

    // Redirect authenticated users if specified
    if (redirectIfAuthenticated && isAuthenticated) {
      if (isSuperAdmin) {
        setLocation("/super-admin/dashboard");
      } else if (isIFSCAUser) {
        setLocation("/ifsca/dashboard");
      } else if (isReportingEntity) {
        setLocation("/user-dashboard");
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isIFSCAUser,
    isReportingEntity,
    redirectIfAuthenticated,
    setLocation,
  ]);

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

  // Don't render children if redirect is happening
  if (redirectIfAuthenticated && isAuthenticated) return null;

  return <>{children}</>;
};
