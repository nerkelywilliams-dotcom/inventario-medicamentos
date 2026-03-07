import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCircle } from "lucide-react";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <span className="text-white font-black text-xl">SSIA</span>
          </div>
          <span className="font-bold text-lg text-[#1a2b4b]">Gestión Médica</span>
        </div>

        {/* Navegación */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <Link href="#inicio" className="hover:text-primary transition-colors">Inicio</Link>
          <Link href="#nosotros" className="hover:text-primary transition-colors">Sobre SSIA</Link>
          <Link href="#contacto" className="hover:text-primary transition-colors">Contacto</Link>
        </nav>

        {/* Botón CTA */}
        <Button asChild className="bg-primary hover:bg-primary/90 font-bold shadow-md shadow-primary/20">
          <Link href="/inventory">
            <UserCircle className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Link>
        </Button>
      </div>
    </header>
  );
}