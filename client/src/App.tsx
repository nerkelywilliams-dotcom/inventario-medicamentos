"use client"



import * as React from "react"

import { Switch, Route, Link, useLocation, Redirect } from "wouter";

import { queryClient } from "./lib/queryClient";

import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";

import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/context/AuthContext";

import {

  Loader2,

  LayoutDashboard,

  Package,

  Users as UsersIcon,

  Settings as SettingsIcon,

  Baby,

  LogOut,

  ClipboardList,

  UserCircle

} from "lucide-react";



// Importación de componentes del Sidebar

import {

  Sidebar,

  SidebarContent,

  SidebarFooter,

  SidebarGroup,

  SidebarGroupLabel,

  SidebarHeader,

  SidebarMenu,

  SidebarMenuButton,

  SidebarMenuItem,

  SidebarProvider,

  SidebarTrigger,

} from "@/components/ui/sidebar";



// Importación de Páginas

import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";

import Inventory from "@/pages/Inventory";

import FamiliesPage from "@/pages/FamiliesPage";

import UsersPage from "@/pages/Users";

import LandingPage from "@/pages/LandingPage";

import Login from "@/pages/Login";

import SettingsPage from "@/pages/Settings";

import LogsPage from "@/pages/logs-page";



function Router() {

  const { user, isLoading, logout } = useAuth();

  const [location] = useLocation();



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



  // ✅ LÓGICA DE RUTA PÚBLICA: si no hay usuario, mostramos Landing o Login

  if (!user) {

    return (

      <Switch>

        <Route path="/" component={LandingPage} />

        <Route path="/auth" component={Login} />

        <Route>

          <Redirect to="/" />

        </Route>

      </Switch>

    );

  }



  return (

    <div className="flex min-h-screen w-full bg-slate-50">

      <Sidebar>

        <SidebarHeader>

          <div className="flex items-center gap-3 px-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg overflow-hidden border border-slate-200">

              <img src="/image.png" alt="Logo Magdaleno" className="h-full w-full object-contain" />

            </div>

            <div className="flex flex-col">

              <span className="text-sm font-bold leading-none">MediStock</span>

              <span className="text-[10px] text-slate-400 font-medium">Gestión Farmacéutica</span>

            </div>

          </div>

        </SidebarHeader>



        <SidebarContent>

          <SidebarGroup>

            <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>

            <SidebarMenu>

              <SidebarMenuItem>

                <SidebarMenuButton asChild isActive={location === "/"} tooltip="Panel Principal">

                  <Link href="/">

                    <LayoutDashboard className="size-4" />

                    <span>Panel Principal</span>

                  </Link>

                </SidebarMenuButton>

              </SidebarMenuItem>

             

              <SidebarMenuItem>

                <SidebarMenuButton asChild isActive={location === "/inventory"} tooltip="Inventario">

                  <Link href="/inventory">

                    <Package className="size-4" />

                    <span>Inventario</span>

                  </Link>

                </SidebarMenuButton>

              </SidebarMenuItem>



              <SidebarMenuItem>

                <SidebarMenuButton

                  asChild

                  isActive={location === "/inventory" && window.location.search.includes("filter=pediatric")}

                  tooltip="Área Pediátrica"

                >

                  <Link href="/inventory?filter=pediatric">

                    <Baby className="size-4 text-blue-400" />

                    <span className="text-blue-600/90 font-semibold">Área Pediátrica</span>

                  </Link>

                </SidebarMenuButton>

              </SidebarMenuItem>

            </SidebarMenu>

          </SidebarGroup>



          <SidebarGroup className="mt-4">

            <SidebarGroupLabel>Configuración</SidebarGroupLabel>

            <SidebarMenu>

              {user.role === 'admin' && (

                <>

                  <SidebarMenuItem>

                    <SidebarMenuButton asChild isActive={location === "/families"} tooltip="Familias">

                      <Link href="/families">

                        <SettingsIcon className="size-4" />

                        <span>Familias</span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                  <SidebarMenuItem>

                    <SidebarMenuButton asChild isActive={location === "/users"} tooltip="Usuarios">

                      <Link href="/users">

                        <UsersIcon className="size-4" />

                        <span>Usuarios</span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                  <SidebarMenuItem>

                    <SidebarMenuButton asChild isActive={location === "/bitacora"} tooltip="Bitácora">

                      <Link href="/bitacora">

                        <ClipboardList className="size-4" />

                        <span>Bitácora</span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                </>

              )}

              <SidebarMenuItem>

                <SidebarMenuButton asChild isActive={location === "/settings"} tooltip="Ajustes">

                  <Link href="/settings">

                    <UserCircle className="size-4" />

                    <span>Mi Perfil</span>

                  </Link>

                </SidebarMenuButton>

              </SidebarMenuItem>

            </SidebarMenu>

          </SidebarGroup>

        </SidebarContent>



        <SidebarFooter>

          <div className="rounded-[1.4rem] bg-slate-900 p-4 flex flex-col gap-4 m-2 border border-slate-800">

            <div className="flex flex-col gap-1">

              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Usuario</p>

              <p className="text-sm font-bold text-white truncate">{user.username}</p>

              <p className="text-[10px] text-slate-400 italic">Sede: {user.inventoryLocation === 'maracay' ? 'SSIA Maracay' : 'SSIA Magdaleno'}</p>

            </div>

            <SidebarMenuButton

              onClick={() => logout()}

              variant="outline"

              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400 h-10 w-full justify-center"

            >

              <LogOut className="size-4" />

              <span>Cerrar Sesión</span>

            </SidebarMenuButton>

          </div>

        </SidebarFooter>

      </Sidebar>



      <main className="flex-1 overflow-y-auto h-screen relative">

        <div className="md:hidden p-4 absolute top-0 left-0 z-50">

          <SidebarTrigger />

        </div>



        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">

          <Switch>

            <Route path="/" component={Dashboard} />

            <Route path="/inventory" component={Inventory} />

            <Route path="/settings" component={SettingsPage} />

           

            <Route path="/bitacora">

              {user.role === 'admin' ? <LogsPage /> : <NotFound />}

            </Route>

           

            <Route path="/families">

              {user.role === 'admin' ? <FamiliesPage /> : <NotFound />}

            </Route>

           

            <Route path="/users">

              {user.role === 'admin' ? <UsersPage /> : <NotFound />}

            </Route>

           

            <Route component={NotFound} />

          </Switch>

        </div>

      </main>

    </div>

  );

}



function App() {

  return (

    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

}

export default App;