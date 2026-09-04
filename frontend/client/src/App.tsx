import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary"; 
import { LoadingProvider } from "./contexts/LoadingContext"; 
import { NotificationProvider } from "./contexts/NotificationContext"; 
import { useAuth } from "./hooks/useAuth";
 
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
import DirectChat from "./pages/DirectChat";
import UserProfile from "./pages/UserProfile";

/** Renders the correct dashboard for the logged-in role, or redirects to /login */
function DashboardGate({ role }: { role?: "customer" | "provider" | "admin" }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) return null;

  if (!user) {
    navigate("/login");
    return null;
  }

  const userRole = user.role as string;

  // If a specific role is required and the user has a different role, redirect to their dashboard
  if (role && userRole !== role) {
    navigate(userRole === "provider" ? "/dashboard/provider" : userRole === "admin" ? "/dashboard/admin" : "/dashboard/customer");
    return null;
  }

  if (userRole === "provider") return <ProviderDashboard />;
  if (userRole === "admin") return <AdminDashboard />;
  return <CustomerDashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/search" component={SearchPage} />
      <Route path="/job/:jobId" component={JobDetail} />
      <Route path="/provider/:providerId" component={ProviderProfile} />
      <Route path="/user/:userId" component={UserProfile} />
      <Route path="/dashboard">{() => <DashboardGate />}</Route>
      <Route path="/dashboard/customer">{() => <DashboardGate role="customer" />}</Route>
      <Route path="/dashboard/provider">{() => <DashboardGate role="provider" />}</Route>
      <Route path="/dashboard/admin">{() => <DashboardGate role="admin" />}</Route>
      <Route path="/chat/direct/:chatId" component={DirectChat} />
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