import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      title: "Control de Inventario",
      icon: <ClipboardList className="h-6 w-6 text-blue-600" aria-hidden="true" />,
    },
    {
      title: "Alertas de Vencimiento",
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden="true" />,
    },
    {
      title: "Seguridad Institucional",
      icon: <ShieldCheck className="h-6 w-6 text-emerald-600" aria-hidden="true" />,
    },
    {
      title: "Análisis de Existencias",
      icon: <BarChart3 className="h-6 w-6 text-blue-600" aria-hidden="true" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav
        role="navigation"
        className="border-b border-slate-100 py-4"
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <span className="text-xl font-bold text-slate-900">SSIA</span>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Iniciar Sesión</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section
        aria-label="hero"
        className="py-20 lg:py-32 bg-slate-50 flex-1"
      >
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Sistema Certificado de Gestión Médica</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
              SSIA: La evolución en el{" "}
              <span className="text-blue-600">control de inventario</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
              Plataforma profesional diseñada para optimizar el flujo de
              suministros clínicos con precisión y transparencia.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            >
              <Link to="/auth">
                Acceder al Sistema{" "}
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl rotate-3 opacity-10 blur-2xl" />
            <div
              className="relative bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 flex items-center justify-center text-slate-400"
              style={{ width: '500px', height: '300px' }}
              aria-label="Vista previa del panel de control de SSIA"
            >
              Dashboard Preview (Imagen placeholder)
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section aria-label="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center space-y-2"
              >
                {f.icon}
                <p className="font-semibold">{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Datos de Contacto SSIA</h2>
            <div className="space-y-4 text-slate-400">
              <p>📍 Maracay, Venezuela</p>
              <p>☎️ +1 (555) 123‑4567</p>
              <p>✉️ contacto@ssia.example.com</p>
              <p>🕒 Lun‑Vie 9:00‑18:00</p>
            </div>
          </div>
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Clock className="h-5 w-5" aria-hidden="true" />
              <span>Horario de atención</span>
            </div>
            <p className="text-slate-400 italic">
              "Eficiencia para una atención médica ininterrumpida."
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-slate-100 text-slate-600 text-center text-sm">
        &copy; {new Date().getFullYear()} SSIA. Todos los derechos reservados.{" "}
        <Link to="/terms" className="underline">
          Términos
        </Link>{" "}
        •{" "}
        <Link to="/privacy" className="underline">
          Privacidad
        </Link>
      </footer>
    </div>
  );
}