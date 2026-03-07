import { MapPin, Mail, Phone, Clock } from "lucide-react";

export default function Contact() {
  return (
    <section id="contacto" className="py-24 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Lado izquierdo: Información de contacto */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Datos de Contacto SSIA</h2>
            <p className="text-slate-400">¿Necesitas soporte técnico o información sobre las sedes? Nuestro equipo está a disposición.</p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-blue-400 mt-1" />
                <div>
                  <h4 className="font-semibold">Sedes Operativas</h4>
                  <p className="text-slate-400 text-sm">Maracay, Aragua | Magdaleno, Aragua</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-blue-400 mt-1" />
                <div>
                  <h4 className="font-semibold">Atención Administrativa</h4>
                  <p className="text-slate-400 text-sm">+58 (000) 000-0000</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-blue-400 mt-1" />
                <div>
                  <h4 className="font-semibold">Soporte Técnico</h4>
                  <p className="text-slate-400 text-sm">soporte.ssia@tuclinica.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado derecho: Visual/Mapa */}
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-5 w-5 text-blue-400" />
              <h4 className="font-semibold">Horario de Soporte</h4>
            </div>
            <p className="text-slate-400 text-sm italic mb-6">
              "La eficiencia en la gestión de inventario es la base de una atención médica ininterrumpida."
            </p>
            <div className="w-full h-48 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
              <span className="text-slate-500 font-medium">Ubicación Integrada</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}