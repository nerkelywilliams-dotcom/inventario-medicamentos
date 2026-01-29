import { useMedications } from "@/hooks/use-medications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, AlertCircle, AlertTriangle, PackageSearch, Clock, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { differenceInDays, isAfter } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: medications, isLoading } = useMedications();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 bg-[#f8fafc]">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-[2.5rem]" />
            <Skeleton className="h-96 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  // --- TU LÓGICA FUNCIONAL (INTACTA) ---
  const totalMedications = medications?.length || 0;
  const now = new Date();
  const expired = medications?.filter(m => !isAfter(new Date(m.expirationDate), now)).length || 0;
  const lowStock = medications?.filter(m => m.quantity < 10).length || 0;
  const inStock = totalMedications - (medications?.filter(m => m.quantity === 0).length || 0);

  const stats = [
    {
      title: "Total Medicamentos",
      value: totalMedications,
      icon: Pill,
      color: "bg-[#1e40af]", // Azul Institucional
      text: "text-white",
      desc: "Registrados en sistema"
    },
    {
      title: "Stock Crítico",
      value: lowStock,
      icon: AlertTriangle,
      color: "bg-[#f97316]", // Naranja Alerta
      text: "text-white",
      desc: "< 10 unidades"
    },
    {
      title: "Vencidos",
      value: expired,
      icon: AlertCircle,
      color: "bg-[#dc2626]", // Rojo Urgente
      text: "text-white",
      desc: "Retirar inmediatamente"
    },
  ];

  const data = [
    { name: 'Disponible', value: inStock, color: '#1e40af' }, 
    { name: 'Bajo Stock', value: lowStock, color: '#f97316' }, 
    { name: 'Agotado', value: totalMedications - inStock, color: '#dc2626' }, 
  ];

  return (
    <div className="space-y-10 p-2 md:p-6 bg-[#f8fafc] min-h-screen animate-fade-in">
      {/* CABECERA */}
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Panel Principal</h2>
        <p className="text-slate-500 font-medium italic">Sede Magdaleno • Gestión de Inventario Farmacéutico</p>
      </div>

      {/* TARJETAS DE MÉTRICAS CON TU DISEÑO REQUERIDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={`${stat.color} ${stat.text} p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 relative overflow-hidden group transition-transform hover:scale-[1.02]`}>
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">{stat.title}</p>
                <h3 className="text-5xl font-black mb-1">{stat.value}</h3>
                <p className="text-[10px] font-bold uppercase opacity-70 tracking-wider">{stat.desc}</p>
              </div>
              <stat.icon className="absolute right-[-10px] bottom-[-10px] h-28 w-28 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO CIRCULAR */}
        <Card className="border-none shadow-sm rounded-[3rem] p-4 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                <div className="h-2 w-8 bg-blue-600 rounded-full" />
                Estado del Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PRÓXIMOS A VENCER */}
        <Card className="border-none shadow-sm rounded-[3rem] p-4 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              Próximos a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expired === 0 && medications?.filter(m => {
                const expiry = new Date(m.expirationDate);
                return isAfter(expiry, now) && differenceInDays(expiry, now) <= 60;
            }).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-slate-300">
                <PackageSearch className="w-16 h-16 mb-4 opacity-10" />
                <p className="font-bold uppercase text-xs tracking-widest">Sin alertas de vencimiento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medications?.filter(m => {
                   const expiry = new Date(m.expirationDate);
                   return differenceInDays(expiry, now) <= 60;
                })
                .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                .slice(0, 5)
                .map(med => {
                  const daysLeft = differenceInDays(new Date(med.expirationDate), now);
                  const isExpired = daysLeft <= 0;

                  return (
                    <div key={med.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${isExpired ? 'bg-red-50 text-red-500' : 'bg-white text-blue-600'}`}>
                           <Pill size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm leading-tight">{med.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{med.presentation}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`text-sm font-black ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                             {daysLeft} días
                          </p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                            {isExpired ? 'Vencido' : 'Restantes'}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-slate-200" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}