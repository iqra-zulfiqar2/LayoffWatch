import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Analytics from "@/pages/analytics";
import Pricing from "@/pages/pricing";
import Subscription from "@/pages/subscription";
import EnhancedHomepage from "@/pages/enhanced-homepage";
import AuthLanding from "@/pages/auth-landing";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/pricing" component={Pricing} />
      <Route path="/login" component={AuthLanding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/subscription" component={Subscription} />
      {/* Main homepage - accessible to all users */}
      <Route path="/" component={EnhancedHomepage} />
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
