import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation, MobileNav } from "@/components/Navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Families from "@/pages/Families";
import Users from "@/pages/Users";
import Login from "@/pages/Login";

type UserRole = 'admin' | 'viewer';

function ProtectedRoute({ 
  component: Component, 
  requiredRole
}: { 
  component: React.ComponentType; 
  requiredRole?: UserRole;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/families">
              {user.role === 'admin' ? <Families /> : <NotFound />}
            </Route>
            <Route path="/users">
              {user.role === 'admin' ? <Users /> : <NotFound />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
