import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import AdminPanel from "@/pages/admin";
import Dashboard from "@/pages/dashboard";
import TemplateDetail from "@/pages/template-detail";

function PrivateRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }
  
  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin">
        {() => <PrivateRoute component={AdminPanel} adminOnly={true} />}
      </Route>
      <Route path="/dashboard">
        {() => <PrivateRoute component={Dashboard} />}
      </Route>
      <Route path="/template/:id">
        {(params) => <PrivateRoute component={TemplateDetail} params={params} />}
      </Route>
      <Route path="/submission/:id">
        {(params) => <PrivateRoute component={Home} params={params} />}
      </Route>
      <Route path="/">
        {() => {
          if (!user) {
            return <Redirect to="/login" />;
          }
          return user.role === "admin" ? <Redirect to="/admin" /> : <Redirect to="/dashboard" />;
        }}
      </Route>
      <Route component={NotFound} />
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
