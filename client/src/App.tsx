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
import AdminPortalPage from "@/pages/admin-portal";
import UserLoginPage from "@/pages/user-login";
import SubmissionViewPage from "@/pages/submission-view";
import UserManagementPage from "@/pages/user-management";
import ExcelAnalyzerPage from "@/pages/excel-analyzer";

function Router() {
  return (
    <Switch>
      {/* Public routes with different layouts */}
      <Route path="/admin-login">
        <Layout showHeader={false}>
          <PublicRoute redirectIfAuthenticated>
            <AdminLoginPage />
          </PublicRoute>
        </Layout>
      </Route>
      <Route path="/admin-portal">
        <Layout showHeader={false}>
          <AdminPortalPage />
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
      <Route path="/template/:id">
        <Layout>
          <TemplateDetail />
        </Layout>
      </Route>

      {/* Admin protected routes */}
      <Route path="/admin-dashboard">
        <Layout>
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        </Layout>
      </Route>
      <Route path="/admin-submissions">
        <Layout>
          <AdminRoute>
            <AdminSubmissionsPage />
          </AdminRoute>
        </Layout>
      </Route>
      <Route path="/admin-templates">
        <Layout>
          <AdminRoute>
            <AdminTemplatesPage />
          </AdminRoute>
        </Layout>
      </Route>
      <Route path="/user-management">
        <Layout>
          <AdminRoute>
            <UserManagementPage />
          </AdminRoute>
        </Layout>
      </Route>
      <Route path="/excel-analyzer">
        <Layout>
          <AdminRoute>
            <ExcelAnalyzerPage />
          </AdminRoute>
        </Layout>
      </Route>

      {/* User protected routes */}
      <Route path="/user-dashboard">
        <Layout>
          <UserRoute>
            <UserDashboardPage />
          </UserRoute>
        </Layout>
      </Route>
      <Route path="/user-submission">
        <Layout>
          <UserRoute>
            <UserSubmissionPage />
          </UserRoute>
        </Layout>
      </Route>
      <Route path="/submission-history">
        <Layout>
          <UserRoute>
            <SubmissionHistoryPage />
          </UserRoute>
        </Layout>
      </Route>

      {/* Mixed authentication routes */}
      <Route path="/template-management">
        <Layout>
          <ProtectedRoute>
            <TemplateManagement />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/validation-results/:id">
        <Layout>
          <ProtectedRoute>
            <ValidationResultsPage />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/submission-view/:id">
        <Layout>
          <ProtectedRoute>
            <SubmissionViewPage />
          </ProtectedRoute>
        </Layout>
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
