import { ClipboardList, AlertTriangle, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  {
    title: "Control de Inventario",
    description: "Gestión centralizada en tiempo real de todos tus insumos y medicamentos.",
    icon: <ClipboardList className="h-6 w-6 text-blue-600" />
  },
  {
    title: "Alertas de Vencimiento",
    description: "Sistema inteligente que notifica sobre lotes próximos a caducar para evitar pérdidas.",
    icon: <AlertTriangle className="h-6 w-6 text-amber-500" />
  },
  {
    title: "Seguridad Institucional",
    description: "Acceso restringido y encriptado, garantizando la integridad de tu data médica.",
    icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />
  },
  {
    title: "Análisis de Existencias",
    description: "Reportes automatizados sobre el estado de tu stock por familias y categorías.",
    icon: <BarChart3 className="h-6 w-6 text-blue-600" />
  }
];

export default function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Funcionalidades diseñadas para la precisión</h2>
          <p className="text-slate-600">Todo lo que necesitas para una gestión eficiente, centralizada en una interfaz intuitiva.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-all hover:shadow-lg group">
              <div className="mb-4 p-3 bg-white w-fit rounded-lg shadow-sm">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}