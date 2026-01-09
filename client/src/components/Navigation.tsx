import { Link, useLocation } from "wouter";
import { LayoutDashboard, Pill, FileText, Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Panel Principal", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventario", icon: Pill },
    { href: "/families", label: "Familias", icon: Settings },
  ];

  return (
    <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen p-4 sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-4 py-6 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight text-foreground">MediStock</h1>
          <p className="text-xs text-muted-foreground">Gestión Farmacéutica</p>
        </div>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}>
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-4 py-6 border-t border-border">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/20 p-4 rounded-xl border border-primary/5">
          <h3 className="font-semibold text-primary mb-1 text-sm">¿Necesitas ayuda?</h3>
          <p className="text-xs text-muted-foreground mb-3">Contacta a soporte técnico para asistencia.</p>
          <button className="text-xs font-medium text-primary hover:underline">
            Contactar Soporte
          </button>
        </div>
      </div>
    </nav>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", icon: LayoutDashboard },
    { href: "/inventory", icon: Pill },
    { href: "/families", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3 flex justify-between items-center z-50 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link key={item.href} href={item.href} className={cn(
            "p-3 rounded-full transition-colors",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          )}>
            <Icon className="h-6 w-6" />
          </Link>
        );
      })}
    </div>
  );
}
