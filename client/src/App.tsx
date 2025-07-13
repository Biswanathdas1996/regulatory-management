import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TemplateDetail from "@/pages/template-detail";
import TemplateManagement from "@/pages/template-management";
import UserSubmissionPage from "@/pages/user-submission";
import ValidationResultsPage from "@/pages/validation-results";
import UserDashboardPage from "@/pages/user-dashboard";
import SubmissionHistoryPage from "@/pages/submission-history";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/template/:id" component={TemplateDetail} />
      <Route path="/template-management" component={TemplateManagement} />
      <Route path="/user-submission" component={UserSubmissionPage} />
      <Route path="/user-dashboard" component={UserDashboardPage} />
      <Route path="/submission-history" component={SubmissionHistoryPage} />
      <Route path="/validation-results/:id" component={ValidationResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
