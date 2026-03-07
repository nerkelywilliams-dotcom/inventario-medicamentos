import React from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Política de Privacidad</h1>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Información que Recopilamos</h2>
            <p>
              SSIA recopila información que usted proporciona directamente, incluyendo nombre, correo
              electrónico, teléfono e información relacionada con su cuenta. También podemos recopilar
              información automáticamente sobre cómo utiliza nuestra plataforma, incluyendo dirección IP,
              tipo de navegador y páginas visitadas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Uso de la Información</h2>
            <p>
              Utilizamos la información recopilada para proporcionar, mantener y mejorar nuestros servicios,
              procesar transacciones, enviar comunicaciones administrativas y marketing (cuando corresponda),
              y cumplir con obligaciones legales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Protección de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas, administrativas y físicas diseñadas para
              proteger su información personal contra acceso no autorizado, alteración, divulgación o
              destrucción. Sin embargo, ningún método de transmisión por internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Compartición de Información</h2>
            <p>
              No vendemos, intercambiamos ni alquilamos su información personal a terceros. Podemos
              compartir información con proveedores de servicios que nos ayudan a operar nuestro sitio
              y conducir nuestro negocio, siempre bajo estrictas obligaciones de confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Cookies</h2>
            <p>
              Nuestro sitio utiliza cookies para mejorar su experiencia. Puede configurar su navegador
              para rechazar cookies, pero esto puede afectar la funcionalidad de ciertos servicios.
              Utilizamos cookies de sesión y persistentes según sea necesario.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Derechos del Usuario</h2>
            <p>
              Tiene derecho a acceder, rectificar, suprimir y portabilidad de sus datos personales.
              Para ejercer estos derechos, contáctenos en contacto@ssia.example.com. Responderemos
              a sus solicitudes dentro de 30 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Cambios en Esta Política</h2>
            <p>
              Podemos actualizar esta política de privacidad periódicamente. Le notificaremos sobre
              cambios significativos publicando la política actualizada en nuestro sitio y actualizando
              la fecha de "Última actualización" a continuación.
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