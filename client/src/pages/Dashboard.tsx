import { useMedications } from "@/hooks/use-medications";
import { Pill, AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { differenceInDays, isAfter } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: medications, isLoading } = useMedications();
  const now = new Date();

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

  // Cálculos funcionales
  const total = medications?.length || 0;
  const expired = medications?.filter(m => !isAfter(new Date(m.expirationDate), now)).length || 0;
  const lowStock = medications?.filter(m => m.quantity < 10).length || 0;
  const inStock = total - (medications?.filter(m => m.quantity === 0).length || 0);

  const stats = [
    { title: "TOTAL MEDICAMENTOS", value: total, color: "bg-[#2563eb]", icon: Pill }, // Azul
    { title: "STOCK CRÍTICO", value: lowStock, color: "bg-[#f97316]", icon: AlertTriangle }, // Naranja
    { title: "VENCIDOS", value: expired, color: "bg-[#dc2626]", icon: AlertCircle }, // Rojo
  ];

  return (
    <div className="p-8 bg-white min-h-screen space-y-10 font-sans">
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Panel Principal</h2>
        <p className="text-slate-400 text-sm font-medium italic mt-1">Sede Magdaleno • Gestión de Inventario</p>
      </div>

      {/* TARJETAS SUPERIORES (Mantienen números grandes para impacto) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.color} text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-lg h-48 flex flex-col justify-between group`}
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 uppercase">{stat.title}</p>
              <h3 className="text-6xl font-black mt-2">{stat.value}</h3>
              <p className="text-[9px] font-bold opacity-60 uppercase mt-1">Registrados</p>
            </div>
            <stat.icon className="absolute right-[-10px] bottom-[-15px] h-32 w-32 opacity-10 rotate-12 group-hover:scale-105 transition-transform" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO CIRCULAR */}
        <div className="bg-[#f8fafc] rounded-[3rem] p-8 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1.5 w-8 bg-[#2563eb] rounded-full" />
            <h3 className="text-lg font-extrabold text-[#1e293b]">Estado del Inventario</h3>
          </div>
          
          <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={[
                      { name: 'Disponible', value: inStock, color: '#2563eb' },
                      { name: 'Bajo Stock', value: lowStock, color: '#f97316' },
                      { name: 'Agotado', value: expired, color: '#dc2626' }
                    ]} 
                    innerRadius={65} 
                    outerRadius={90} 
                    dataKey="value" 
                    stroke="none"
                    paddingAngle={6}
                  >
                    <Cell fill="#2563eb" /><Cell fill="#f97316" /><Cell fill="#dc2626" />
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             {/* Leyenda simple */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <PieChart size={40} className="text-slate-400"/>
             </div>
          </div>
        </div>

        {/* LISTA DE VENCIMIENTOS (AQUÍ ESTABA EL PROBLEMA) */}
        {/* He reducido los textos a text-sm y text-base para corregir la desproporción */}
        <div className="bg-[#f8fafc] rounded-[3rem] p-8 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-[#ef4444] w-5 h-5" />
            <h3 className="text-lg font-extrabold text-[#1e293b]">Próximos a Vencer</h3>
          </div>
          
          <div className="space-y-3">
            {medications?.filter(m => differenceInDays(new Date(m.expirationDate), now) <= 60)
              .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
              .slice(0, 4) // Mostramos máximo 4 para que no se alargue demasiado
              .map(med => {
                const days = differenceInDays(new Date(med.expirationDate), now);
                const isExpired = days <= 0;
                
                return (
                  <div key={med.id} className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:scale-[1.01] transition-transform">
                    <div className="flex items-center gap-4">
                      {/* Icono pequeño y controlado */}
                      <div className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                        <Pill size={18} className="rotate-45" />
                      </div>
                      
                      {/* Texto compacto y limpio */}
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1e293b] text-sm leading-tight line-clamp-1">{med.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{med.presentation}</span>
                      </div>
                    </div>

                    {/* Días restantes en tamaño normal (text-base) en lugar de gigante */}
                    <div className="text-right shrink-0">
                      <p className={`text-base font-black ${isExpired ? 'text-[#dc2626]' : 'text-[#f97316]'} leading-tight`}>
                        {Math.abs(days)} días
                      </p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                        {isExpired ? "VENCIDO" : "RESTANTES"}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {(!medications || medications.length === 0) && (
                <div className="flex flex-col items-center justify-center py-6 opacity-40">
                    <Clock size={32} className="mb-2"/>
                    <p className="text-xs font-bold uppercase">Todo en orden</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}