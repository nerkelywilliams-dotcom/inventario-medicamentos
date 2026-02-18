import { useLogs } from "@/hooks/use-logs";
import { useMedications } from "@/hooks/use-medications";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter"; // ✅ Importación añadida
import { Pill, AlertCircle, AlertTriangle, Clock, ArrowDownLeft, ArrowUpRight, FileEdit, History, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { differenceInDays, isAfter, format, isValid } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { data: medications } = useMedications();
  const { isAdmin } = useAuth();
  
  // ✅ SOLO CARGAR LOGS SI ES ADMIN
  const { data: logs, isLoading: isLoadingLogs } = useLogs();
  
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
          <div 
            key={stat.title} 
            className={`${stat.color} text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-slate-200 h-52 flex flex-col justify-center group transition-all duration-300 hover:scale-[1.02] cursor-default`}
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-[0.2em] opacity-80 mb-2 uppercase">{stat.title}</p>
              <h3 className="text-7xl font-black mb-1 leading-none">{stat.value}</h3>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Registrados en sistema</p>
            </div>
            <stat.icon 
                className="absolute right-[-15px] bottom-[-15px] h-36 w-36 opacity-10 rotate-12 transition-transform duration-500 ease-out group-hover:scale-125 group-hover:-translate-x-4 group-hover:-translate-y-4 group-hover:rotate-[24deg]" 
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* GRÁFICO CIRCULAR */}
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
                <div key={med.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-colors hover:border-red-100 hover:bg-red-50/10">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-rose-50 text-[#dc2626] rounded-xl flex items-center justify-center shrink-0">
                      <Pill size={20} className="rotate-45" />
                    </div>
                    <div>
                      {/* ✅ CORRECCIÓN: Se usa med.catalog.name en lugar de med.name */}
                      <p className="font-bold text-[#1a2b4b] text-base leading-tight">
                        {med.catalog?.name || "Medicamento"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{med.presentation}</p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0 min-w-[80px]">
                    <p className={`text-base font-black leading-none ${days < 0 ? 'text-[#dc2626]' : 'text-orange-500'}`}>
                      {days} días
                    </p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-1">
                      {days < 0 ? 'Vencido' : 'Por vencer'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN BITÁCORA (SOLO PARA ADMINS) --- */}
      {isAdmin && (
      <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-2xl">
                    <History className="text-[#1a2b4b] w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-[#1a2b4b]">Bitácora de Movimientos</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Últimos cambios registrados</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {isLoadingLogs && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
                <Link href="/bitacora">
                    <a className="text-sm font-bold text-[#2b4cc4] hover:text-[#1a2b4b] hover:underline transition-colors flex items-center gap-1 cursor-pointer">
                        Ver todo <ArrowUpRight className="w-3 h-3" />
                    </a>
                </Link>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-100 text-left">
                        <th className="pb-4 pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Fecha</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {logs?.slice(0, 5).map((log) => { 
                      const dateObj = new Date(log.timestamp);
                      const isDateValid = isValid(dateObj);

                      return (
                        <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4 pl-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                                    ${log.action === 'INGRESO' ? 'bg-emerald-100 text-emerald-600' : 
                                      log.action === 'SALIDA' ? 'bg-rose-100 text-rose-600' : 
                                      log.action === 'ELIMINACIÓN' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {log.action === 'INGRESO' && <ArrowDownLeft size={20} />}
                                    {log.action === 'SALIDA' && <ArrowUpRight size={20} />}
                                    {(log.action === 'ACTUALIZACIÓN' || log.action === 'ELIMINACIÓN') && <FileEdit size={20} />}
                                </div>
                            </td>
                            <td className="py-4">
                                {/* ✅ MEJORA: Se asegura de mostrar el nombre de la bitácora */}
                                <p className="font-bold text-[#1a2b4b] text-sm uppercase">{log.medicationName}</p>
                                <p className="text-xs font-medium text-slate-500">
                                    {log.details}
                                </p>
                            </td>
                            <td className="py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                                    {log.user?.username || 'Sistema'}
                                </span>
                            </td>
                            <td className="py-4 text-right pr-4">
                                <p className="text-sm font-bold text-slate-600">
                                  {isDateValid ? format(dateObj, 'dd MMM', { locale: es }) : '---'}
                                </p>
                                <p className="text-[10px] font-medium text-slate-400">
                                  {isDateValid ? format(dateObj, 'HH:mm') : '--:--'}
                                </p>
                            </td>
                        </tr>
                      );
                    })}
                    
                    {(!logs || logs.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-400 font-bold italic">
                          {isLoadingLogs ? 'Cargando bitácora...' : 'No se han registrado movimientos todavía.'}
                        </td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      )}
    </div>
  );
}