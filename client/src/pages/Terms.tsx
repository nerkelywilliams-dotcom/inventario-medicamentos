import React from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 py-4">
        <div className="container mx-auto px-4">
          <Link to="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Términos y Condiciones</h1>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Aceptación de Términos</h2>
            <p>
              Al acceder y utilizar la plataforma SSIA (Sistema de Inventario Médico), usted acepta
              estar vinculado por estos términos y condiciones. Si no está de acuerdo con alguna parte
              de estos términos, le pedimos que no utilize el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Uso Permitido</h2>
            <p>
              Usted se compromete a utilizar esta plataforma únicamente con fines legales y de conformidad
              con todas las leyes, normas y regulaciones aplicables. No puede utilizar el servicio de
              manera que viole derechos de terceros o restrinja su acceso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Cuentas de Usuario</h2>
            <p>
              Es responsable de mantener la confidencialidad de su contraseña y cuenta. Usted acepta
              toda actividad que ocurra bajo su cuenta. Debe notificar inmediatamente de cualquier uso
              no autorizado de su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Limitación de Responsabilidad</h2>
            <p>
              En ningún caso SSIA será responsable por daños indirectos, incidentales, especiales,
              consecuentes o punitivos derivados del uso o la imposibilidad de usar el servicio,
              incluso si hemos sido informados de la posibilidad de tales daños.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Modificaciones del Servicio</h2>
            <p>
              Nos reservamos el derecho de modificar o descontinuar el servicio en cualquier momento,
              con o sin notificación previa. No seremos responsables ante usted o terceros por cualquier
              modificación, suspensión o descontinuación del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Ley Aplicable</h2>
            <p>
              Estos términos y condiciones se rigen por las leyes de Venezuela y usted se somete
              irrevocablemente a la jurisdicción exclusiva de los tribunales ubicados en Venezuela.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-200 mt-8">
            <p className="text-sm text-slate-500">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}