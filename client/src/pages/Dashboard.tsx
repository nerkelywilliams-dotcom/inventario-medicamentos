import { useMedications } from "@/hooks/use-medications";
import { Pill, AlertCircle, AlertTriangle, PackageSearch, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { differenceInDays, isAfter } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: medications, isLoading } = useMedications();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 bg-white">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-44 rounded-[3rem]" />
          <Skeleton className="h-44 rounded-[3rem]" />
          <Skeleton className="h-44 rounded-[3rem]" />
        </div>
      </div>
    );
  }

  // --- LÓGICA FUNCIONAL (Mantenida) ---
  const totalMedications = medications?.length || 0;
  const now = new Date();
  const expired = medications?.filter(m => !isAfter(new Date(m.expirationDate), now)).length || 0;
  const lowStock = medications?.filter(m => m.quantity < 10).length || 0;
  const inStock = totalMedications - (medications?.filter(m => m.quantity === 0).length || 0);

  const stats = [
    { title: "TOTAL MEDICAMENTOS", value: totalMedications, icon: Pill, color: "bg-[#1d4ed8]", desc: "REGISTRADOS EN SISTEMA" },
    { title: "STOCK CRÍTICO", value: lowStock, icon: AlertTriangle, color: "bg-[#f97316]", desc: "< 10 UNIDADES" },
    { title: "VENCIDOS", value: expired, icon: AlertCircle, color: "bg-[#ef4444]", desc: "RETIRAR INMEDIATAMENTE" },
  ];

  const chartData = [
    { name: 'Disponible', value: inStock, color: '#1d4ed8' }, 
    { name: 'Bajo Stock', value: lowStock, color: '#f97316' }, 
    { name: 'Agotado', value: totalMedications - inStock, color: '#ef4444' }, 
  ];

  return (
    <div className="space-y-10 p-10 bg-[#f8fafc] min-h-screen">
      {/* TÍTULO Y SUBTÍTULO EXACTOS */}
      <div>
        <h2 className="text-5xl font-extrabold text-[#1e293b] tracking-tight">Panel Principal</h2>
        <p className="text-slate-400 font-bold italic mt-2 text-lg">
          Sede Magdaleno • Gestión de Inventario Farmacéutico
        </p>
      </div>

      {/* TARJETAS SUPERIORES ESTILO CÁPSULA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.color} text-white p-12 rounded-[4rem] shadow-2xl shadow-blue-100/20 relative overflow-hidden group`}
          >
            <div className="relative z-10">
              <p className="text-[12px] font-black tracking-[0.2em] opacity-80 mb-3 uppercase">{stat.title}</p>
              <h3 className="text-7xl font-black mb-2 leading-none">{stat.value}</h3>
              <p className="text-[11px] font-bold opacity-75 uppercase tracking-widest">{stat.desc}</p>
            </div>
            {/* ÍCONO DE FONDO EN MARCA DE AGUA */}
            <stat.icon className="absolute right-[-15px] bottom-[-15px] h-36 w-36 opacity-10 rotate-12" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* GRÁFICO CIRCULAR CON INDICADOR AZUL */}
        <div className="bg-white rounded-[5rem] p-16 shadow-sm border border-slate-50">
          <div className="flex items-center gap-5 mb-12">
            <div className="h-2.5 w-16 bg-[#1d4ed8] rounded-full" />
            <h3 className="text-3xl font-black text-[#1e293b]">Estado del Inventario</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={90} outerRadius={125} paddingAngle={8} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-10 mt-10">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRÓXIMOS A VENCER CON ÍCONOS DE CÁPSULA ROJA */}
        <div className="bg-white rounded-[5rem] p-16 shadow-sm border border-slate-50">
          <div className="flex items-center gap-4 mb-12">
            <Clock className="text-red-500 w-8 h-8" />
            <h3 className="text-3xl font-black text-[#1e293b]">Próximos a Vencer</h3>
          </div>
          <div className="space-y-5">
            {medications?.filter(m => differenceInDays(new Date(m.expirationDate), now) <= 60)
              .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
              .slice(0, 5)
              .map(med => {
                const days = differenceInDays(new Date(med.expirationDate), now);
                return (
                  <div key={med.id} className="flex items-center justify-between p-8 bg-[#fcfdfe] rounded-[3rem] border border-slate-50 hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <Pill size={28} className="rotate-45" />
                      </div>
                      <div>
                        <p className="font-black text-[#1e293b] text-xl leading-tight">{med.name}</p>
                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-1">{med.presentation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-red-500">{days} días</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">VENCIDO</p>
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