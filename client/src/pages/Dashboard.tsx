import { useMedications } from "@/hooks/use-medications";
import { Pill, AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { differenceInDays, isAfter } from "date-fns";

export default function Dashboard() {
  const { data: medications } = useMedications();
  const now = new Date();

  // Datos para las estadísticas
  const total = medications?.length || 0;
  const lowStock = medications?.filter(m => m.quantity < 10).length || 0;
  const expired = medications?.filter(m => !isAfter(new Date(m.expirationDate), now)).length || 0;

  const stats = [
    { title: "TOTAL MEDICAMENTOS", value: total, color: "bg-[#2b4cc4]", icon: Pill },
    { title: "STOCK CRÍTICO", value: lowStock, color: "bg-[#f47c20]", icon: AlertTriangle },
    { title: "VENCIDOS", value: expired, color: "bg-[#dc2626]", icon: AlertCircle },
  ];

  return (
    <div className="p-10 bg-white min-h-screen space-y-12">
      <div>
        <h2 className="text-5xl font-extrabold text-[#1a2b4b]">Panel Principal</h2>
        <p className="text-slate-400 font-semibold italic">Sede Magdaleno • Gestión de Inventario Farmacéutico</p>
      </div>

      {/* TARJETAS TIPO CÁPSULA (IGUAL A LA FOTO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.title} className={`${stat.color} text-white p-10 rounded-[3.5rem] relative overflow-hidden shadow-2xl`}>
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-widest opacity-80 uppercase">{stat.title}</p>
              <h3 className="text-7xl font-black my-2">{stat.value}</h3>
              <p className="text-[10px] font-bold opacity-60 uppercase">Registrados en sistema</p>
            </div>
            <stat.icon className="absolute right-[-10px] bottom-[-10px] h-36 w-36 opacity-10 rotate-12" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* GRÁFICO CON INDICADOR AZUL */}
        <div className="bg-[#fcfdfe] rounded-[4rem] p-12 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-2.5 w-12 bg-[#2b4cc4] rounded-full" />
            <h3 className="text-2xl font-extrabold text-[#1a2b4b]">Estado del Inventario</h3>
          </div>
          <div className="h-64 flex flex-col items-center">
             {/* Aquí iría tu ResponsiveContainer con el PieChart */}
             <div className="text-slate-300 italic text-sm">Visualización de disponibilidad</div>
          </div>
        </div>

        {/* LISTA DE VENCIMIENTO CON ICONO DE PÍLDORA */}
        <div className="bg-[#fcfdfe] rounded-[4rem] p-12 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <Clock className="text-red-500 w-6 h-6" />
            <h3 className="text-2xl font-extrabold text-[#1a2b4b]">Próximos a Vencer</h3>
          </div>
          <div className="space-y-4">
            {medications?.filter(m => differenceInDays(new Date(m.expirationDate), now) <= 60).slice(0, 5).map(med => (
              <div key={med.id} className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                    <Pill size={24} className="rotate-45" />
                  </div>
                  <div>
                    <p className="font-black text-[#1a2b4b] text-lg">{med.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{med.presentation}</p>
                  </div>
                </div>
                <div className="text-right text-red-500">
                  <p className="text-xl font-black">-{Math.abs(differenceInDays(new Date(med.expirationDate), now))} días</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase">Vencido</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}