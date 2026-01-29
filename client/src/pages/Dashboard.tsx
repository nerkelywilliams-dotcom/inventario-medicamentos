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
          <Skeleton className="h-40 rounded-[2.5rem]" />
          <Skeleton className="h-40 rounded-[2.5rem]" />
          <Skeleton className="h-40 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  // --- LÓGICA FUNCIONAL ORIGINAL ---
  const totalMedications = medications?.length || 0;
  const now = new Date();
  const expired = medications?.filter(m => !isAfter(new Date(m.expirationDate), now)).length || 0;
  const lowStock = medications?.filter(m => m.quantity < 10).length || 0;
  const inStock = totalMedications - (medications?.filter(m => m.quantity === 0).length || 0);

  const stats = [
    { title: "TOTAL MEDICAMENTOS", value: totalMedications, icon: Pill, color: "bg-[#2b4cc4]", desc: "REGISTRADOS EN SISTEMA" },
    { title: "STOCK CRÍTICO", value: lowStock, icon: AlertTriangle, color: "bg-[#f47c20]", desc: "< 10 UNIDADES" },
    { title: "VENCIDOS", value: expired, icon: AlertCircle, color: "bg-[#dc2626]", desc: "RETIRAR INMEDIATAMENTE" },
  ];

  const chartData = [
    { name: 'Disponible', value: inStock, color: '#2b4cc4' }, 
    { name: 'Bajo Stock', value: lowStock, color: '#f47c20' }, 
    { name: 'Agotado', value: totalMedications - inStock, color: '#dc2626' }, 
  ];

  return (
    <div className="space-y-10 p-8 bg-[#f8fafc] min-h-screen">
      {/* TÍTULO */}
      <div>
        <h2 className="text-4xl font-extrabold text-[#1e293b] tracking-tight">Panel Principal</h2>
        <p className="text-slate-400 font-semibold italic mt-1">Sede Magdaleno • Gestión de Inventario Farmacéutico</p>
      </div>

      {/* TARJETAS SUPERIORES (ESTILO CÁPSULA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.color} text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group`}
          >
            <div className="relative z-10">
              <p className="text-[11px] font-black tracking-[0.15em] opacity-80 mb-2 uppercase">{stat.title}</p>
              <h3 className="text-7xl font-black mb-1 leading-none">{stat.value}</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{stat.desc}</p>
            </div>
            <stat.icon className="absolute right-[-10px] bottom-[-10px] h-32 w-32 opacity-15 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ESTADO DEL INVENTARIO */}
        <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-2 w-12 bg-blue-600 rounded-full" />
            <h3 className="text-2xl font-black text-[#1e293b]">Estado del Inventario</h3>
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
          <div className="flex justify-center gap-8 mt-8">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRÓXIMOS A VENCER */}
        <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-10">
            <Clock className="text-red-500 w-7 h-7" />
            <h3 className="text-2xl font-black text-[#1e293b]">Próximos a Vencer</h3>
          </div>
          <div className="space-y-4">
            {medications?.filter(m => differenceInDays(new Date(m.expirationDate), now) <= 60)
              .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
              .slice(0, 5)
              .map(med => {
                const days = differenceInDays(new Date(med.expirationDate), now);
                return (
                  <div key={med.id} className="flex items-center justify-between p-6 bg-[#fcfdfe] rounded-[2.5rem] border border-slate-50 hover:shadow-md transition-all">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center">
                        <Pill size={24} className="rotate-45" />
                      </div>
                      <div>
                        <p className="font-black text-[#1e293b] text-lg leading-tight">{med.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">{med.presentation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-red-500">{days} días</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">VENCIDO</p>
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