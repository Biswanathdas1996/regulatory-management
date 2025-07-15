import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  ProtectedRoute,
  AdminRoute,
  UserRoute,
  PublicRoute,
  SuperAdminRoute,
  IFSCARoute,
  ReportingEntityRoute,
} from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TemplateDetail from "@/pages/template-detail";
import TemplateManagement from "@/pages/template-management";
import UserSubmissionPage from "@/pages/user-submission";
import ValidationResultsPage from "@/pages/validation-results";
import UserDashboardPage from "@/pages/user-dashboard";
import SubmissionHistoryPage from "@/pages/submission-history";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminSubmissionsPage from "@/pages/admin-submissions";
import AdminTemplatesPage from "@/pages/admin-templates";
import AdminLoginPage from "@/pages/admin-login";
import UserLoginPage from "@/pages/user-login";
import SuperAdminLogin from "@/pages/super-admin-login";
import IFSCALogin from "@/pages/ifsca-login";
import ReportingEntityLogin from "@/pages/reporting-entity-login";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import SuperAdminIFSCAUsers from "@/pages/super-admin-ifsca-users";
import IFSCADashboard from "@/pages/ifsca-dashboard";
import ReportingEntityDashboard from "@/pages/reporting-entity-dashboard";
import SubmissionViewPage from "@/pages/submission-view";
import UserManagementPage from "@/pages/user-management";
import ExcelAnalyzerPage from "@/pages/excel-analyzer";
import AuthTestPage from "@/pages/auth-test";

function Router() {
  return (
    <Switch>
      {/* Public routes with different layouts */}
      <Route path="/super-admin/login">
        <Layout showHeader={false}>
          <PublicRoute redirectIfAuthenticated>
            <SuperAdminLogin />
          </PublicRoute>
        </Layout>
      </Route>
      <Route path="/ifsca/login">
        <Layout showHeader={false}>
          <PublicRoute redirectIfAuthenticated>
            <IFSCALogin />
          </PublicRoute>
        </Layout>
      </Route>
      <Route path="/reporting-entity/login">
        <Layout showHeader={false}>
          <PublicRoute redirectIfAuthenticated>
            <ReportingEntityLogin />
          </PublicRoute>
        </Layout>
      </Route>

      {/* Dashboard routes */}
      <Route path="/super-admin/dashboard">
        <Layout>
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        </Layout>
      </Route>
      <Route path="/super-admin/ifsca-users">
        <Layout>
          <SuperAdminRoute>
            <SuperAdminIFSCAUsers />
          </SuperAdminRoute>
        </Layout>
      </Route>
      <Route path="/ifsca/dashboard">
        <UserDashboardPage />
      </Route>

      {/* Legacy login routes for backward compatibility */}
      <Route path="/admin-login">
        <Layout showHeader={false}>
          <PublicRoute redirectIfAuthenticated>
            <AdminLoginPage />
          </PublicRoute>
        </Layout>
      </Route>
      <Route path="/user-login">
        <Layout showHeader={false}>
          <PublicRoute redirectIfAuthenticated>
            <UserLoginPage />
          </PublicRoute>
        </Layout>
      </Route>

      {/* All other routes with header */}
      <Route path="/">
        <Layout>
          <Home />
        </Layout>
      </Route>
      <Route path="/auth-test">
        <Layout>
          <ProtectedRoute>
            <AuthTestPage />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/template/:id">
        <Layout>
          <TemplateDetail />
        </Layout>
      </Route>

      {/* Legacy admin route for backward compatibility */}
      <Route path="/admin-dashboard">
        <AdminRoute>
          <AdminDashboardPage />
        </AdminRoute>
      </Route>
      <Route path="/admin-submissions">
        <AdminRoute>
          <AdminSubmissionsPage />
        </AdminRoute>
      </Route>
      <Route path="/admin-templates">
        <AdminRoute>
          <AdminTemplatesPage />
        </AdminRoute>
      </Route>
      <Route path="/user-management">
        <AdminRoute>
          <UserManagementPage />
        </AdminRoute>
      </Route>
      <Route path="/excel-analyzer">
        <AdminRoute>
          <ExcelAnalyzerPage />
        </AdminRoute>
      </Route>

      {/* Reporting Entity protected routes */}
      <Route path="/user-dashboard">
        <ReportingEntityRoute>
          <UserDashboardPage />
        </ReportingEntityRoute>
      </Route>
      <Route path="/user-submission">
        <ReportingEntityRoute>
          <UserSubmissionPage />
        </ReportingEntityRoute>
      </Route>
      <Route path="/submission-history">
        <ReportingEntityRoute>
          <SubmissionHistoryPage />
        </ReportingEntityRoute>
      </Route>

      {/* Mixed authentication routes */}
      <Route path="/template-management">
        <ProtectedRoute>
          <TemplateManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/validation-results/:id">
        <ProtectedRoute>
          <ValidationResultsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/submission-view/:id">
        <ProtectedRoute>
          <SubmissionViewPage />
        </ProtectedRoute>
      </Route>

      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
