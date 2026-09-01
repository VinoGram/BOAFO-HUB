import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary"; 
import { LoadingProvider } from "./contexts/LoadingContext"; 
import { NotificationProvider } from "./contexts/NotificationContext"; 
 
import AdminDashboard from "./pages/AdminDashboard"; 
import ChatPage from "./pages/ChatPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SearchPage from "./pages/SearchPage";
import JobDetail from "./pages/JobDetail";
import ProviderProfile from "./pages/ProviderProfile";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import Feed from "./pages/Feed";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/search" component={SearchPage} />
      <Route path="/job/:jobId" component={JobDetail} />
      <Route path="/provider/:providerId" component={ProviderProfile} />
      <Route path="/dashboard/customer" component={CustomerDashboard} />
      <Route path="/dashboard/provider" component={ProviderDashboard} />
      <Route path="/dashboard/admin" component={AdminDashboard} />
      <Route path="/chat/:id" component={ChatPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/feed" component={Feed} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
}