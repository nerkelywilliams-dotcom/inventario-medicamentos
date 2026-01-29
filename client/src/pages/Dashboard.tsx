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
    { title: "STOCK CRÍTICO", value: lowStock, color: "bg-[#1a2b4b]", icon: AlertTriangle }, 
    { title: "VENCIDOS", value: expired, color: "bg-[#dc2626]", icon: AlertCircle },
  ];

  const chartData = [
    { name: 'Disponible', value: total - lowStock - expired, color: '#2b4cc4' },
    { name: 'Bajo Stock', value: lowStock, color: '#1a2b4b' },
    { name: 'Agotado', value: expired, color: '#dc2626' },
  ];

  return (
    <div className="p-10 bg-white min-h-screen space-y-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-black text-[#1a2b4b] tracking-tight">Panel Principal</h2>
        <p className="text-slate-400 font-bold italic">Sede Magdaleno • Gestión de Inventario Farmacéutico</p>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.title} className={`${stat.color} text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-slate-200 h-52 flex flex-col justify-center`}>
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-[0.2em] opacity-80 mb-2 uppercase">{stat.title}</p>
              <h3 className="text-7xl font-black mb-1 leading-none">{stat.value}</h3>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Registrados en sistema</p>
            </div>
            <stat.icon className="absolute right-[-15px] bottom-[-15px] h-36 w-36 opacity-10 rotate-12" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* GRÁFICO */}
        <div className="bg-[#fcfdfe] rounded-[3.5rem] p-12 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-2 w-12 bg-[#2b4cc4] rounded-full" />
            <h3 className="text-2xl font-black text-[#1a2b4b]">Estado del Inventario</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={85} outerRadius={115} paddingAngle={6} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LISTA DE VENCIMIENTO CORREGIDA */}
        <div className="bg-[#fcfdfe] rounded-[3.5rem] p-12 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <Clock className="text-[#dc2626] w-7 h-7" />
            <h3 className="text-2xl font-black text-[#1a2b4b]">Próximos a Vencer</h3>
          </div>
          <div className="space-y-4">
            {medications?.filter(m => differenceInDays(new Date(m.expirationDate), now) <= 60).slice(0, 5).map(med => {
              const days = differenceInDays(new Date(med.expirationDate), now);
              return (
                <div key={med.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    {/* Icono más pequeño y estilizado */}
                    <div className="h-10 w-10 bg-rose-50 text-[#dc2626] rounded-xl flex items-center justify-center shrink-0">
                      <Pill size={20} className="rotate-45" />
                    </div>
                    <div>
                      {/* Nombre del medicamento: El foco principal */}
                      <p className="font-bold text-[#1a2b4b] text-base leading-tight">{med.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{med.presentation}</p>
                    </div>
                  </div>
                  
                  {/* Bloque de fecha: Proporcionado y alineado */}
                  <div className="text-right shrink-0 min-w-[80px]">
                    <p className="text-base font-black text-[#dc2626] leading-none">
                      {days} días
                    </p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-1">
                      Vencido
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}