import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, SidebarTrigger } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import LandingPage from "@/components/LandingPage";
import Login from "@/pages/Login";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import FamiliesPage from "@/pages/FamiliesPage";
import UsersPage from "@/pages/Users";

export default function Router() {
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

  // ✅ RUTAS PÚBLICAS: sin autenticación
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={Login} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  // ✅ RUTAS PROTEGIDAS: con autenticación
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar>
        <SidebarHeader>
          {/* Contenido del header del sidebar */}
        </SidebarHeader>

        <SidebarContent>
          {/* Contenido del sidebar */}
        </SidebarContent>

        <SidebarFooter>
          {/* Footer del sidebar */}
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="md:hidden p-4 absolute top-0 left-0 z-50">
          <SidebarTrigger />
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          <Switch>
            <Route path="/families" component={FamiliesPage} />
            <Route path="/users" component={UsersPage} />
            <Route>
              <Redirect to="/families" />
            </Route>
          </Switch>
        </div>
      </main>
    </div>
  );
}