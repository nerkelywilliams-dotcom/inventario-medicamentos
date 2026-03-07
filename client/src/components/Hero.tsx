import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full py-20 lg:py-32 overflow-hidden bg-slate-50">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Lado izquierdo: Contenido */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Sistema Certificado de Gestión Médica</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            SSIA: La evolución en el <span className="text-blue-600">control de inventario</span>
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
            Plataforma profesional diseñada para optimizar el flujo de suministros clínicos con precisión y transparencia. Acceso seguro para personal autorizado.
          </p>

          <div className="flex gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 shadow-xl shadow-blue-600/20">
              <Link href="/inventory">
                Iniciar Sesión <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Lado derecho: Visual */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-3xl rotate-3 opacity-10 blur-2xl"></div>
          <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-slate-100">
            {/* Aquí puedes poner una captura de tu app o una imagen de un monitor con gráficos */}
            <img 
              src="/path-a-tu-imagen-o-screenshot.jpg" 
              alt="Interfaz SSIA" 
              className="rounded-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}