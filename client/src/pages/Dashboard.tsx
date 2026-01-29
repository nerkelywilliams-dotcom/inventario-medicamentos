import { useMedications } from "@/hooks/use-medications";
import { Pill, AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { differenceInDays, isAfter } from "date-fns";

export default function Dashboard() {
  const { data: medications } = useMedications();
  const now = new Date();

  const total = medications?.length || 0;
  const lowStock = medications?.filter(m => m.quantity < 10).length || 0;
  const expired = medications?.filter(m => !isAfter(new Date(m.expirationDate), now)).length || 0;

  const stats = [
    { title: "TOTAL MEDICAMENTOS", value: total, color: "bg-[#2b4cc4]", icon: Pill },
    { title: "STOCK CRÍTICO", value: lowStock, color: "bg-[#f47c20]", icon: AlertTriangle },
    { title: "VENCIDOS", value: expired, color: "bg-[#dc2626]", icon: AlertCircle },
  ];

  return (
    <div className="p-8 bg-white min-h-screen space-y-10">
      <div>
        <h2 className="text-3xl font-bold text-[#1a2b4b]">Panel Principal</h2>
        <p className="text-slate-400 text-sm font-medium italic">Sede Magdaleno • Gestión de Inventario</p>
      </div>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className={`${stat.color} text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-lg`}>
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-widest opacity-80 uppercase">{stat.title}</p>
              <h3 className="text-5xl font-black my-1">{stat.value}</h3>
              <p className="text-[9px] font-medium opacity-60 uppercase">Registrados en sistema</p>
            </div>
            <stat.icon className="absolute right-[-5px] bottom-[-5px] h-24 w-24 opacity-10 rotate-12" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO */}
        <div className="bg-[#fcfdfe] rounded-[3rem] p-8 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1.5 w-8 bg-[#2b4cc4] rounded-full" />
            <h3 className="text-xl font-bold text-[#1a2b4b]">Estado del Inventario</h3>
          </div>
          <div className="h-60">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: 'Disponible', value: total - lowStock - expired, color: '#2b4cc4' },
                    { name: 'Bajo Stock', value: lowStock, color: '#f47c20' },
                    { name: 'Agotado', value: expired, color: '#dc2626' }
                  ]} innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                    <Cell fill="#2b4cc4" /><Cell fill="#f47c20" /><Cell fill="#dc2626" />
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* LISTA DE VENCIMIENTO (PROPORCIONES CORREGIDAS) */}
        <div className="bg-[#fcfdfe] rounded-[3rem] p-8 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="text-red-500 w-5 h-5" />
            <h3 className="text-xl font-bold text-[#1a2b4b]">Próximos a Vencer</h3>
          </div>
          <div className="space-y-3">
            {medications?.filter(m => differenceInDays(new Date(m.expirationDate), now) <= 60).slice(0, 5).map(med => (
              <div key={med.id} className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                    <Pill size={18} className="rotate-45" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1a2b4b] text-sm">{med.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{med.presentation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-red-500">
                    {Math.abs(differenceInDays(new Date(med.expirationDate), now))} días
                  </p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase">Vencido</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}