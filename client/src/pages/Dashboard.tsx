import { useMedications } from "@/hooks/use-medications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, AlertCircle, AlertTriangle, PackageSearch } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { differenceInDays, isAfter } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: medications, isLoading } = useMedications();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const totalMedications = medications?.length || 0;
  
  const now = new Date();
  const expired = medications?.filter(m => !isAfter(new Date(m.expirationDate), now)).length || 0;
  const expiringSoon = medications?.filter(m => {
    const expiry = new Date(m.expirationDate);
    return isAfter(expiry, now) && differenceInDays(expiry, now) <= 30;
  }).length || 0;
  
  const lowStock = medications?.filter(m => m.quantity < 10).length || 0;
  const inStock = totalMedications - (medications?.filter(m => m.quantity === 0).length || 0);

  const stats = [
    {
      title: "Total Medicamentos",
      value: totalMedications,
      icon: Pill,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "Registrados en sistema"
    },
    {
      title: "Stock Crítico",
      value: lowStock,
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
      desc: "< 10 unidades"
    },
    {
      title: "Vencidos",
      value: expired,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      desc: "Retirar inmediatamente"
    },
  ];

  const data = [
    { name: 'Disponible', value: inStock, color: '#3b82f6' }, // blue-500
    { name: 'Bajo Stock', value: lowStock, color: '#f97316' }, // orange-500
    { name: 'Agotado', value: totalMedications - inStock, color: '#ef4444' }, // red-500
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground mb-2">Panel Principal</h2>
        <p className="text-muted-foreground">Resumen general del estado del inventario farmacéutico.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold font-display">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Estado del Inventario</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Próximos a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringSoon === 0 && expired === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <PackageSearch className="w-12 h-12 mb-3 opacity-20" />
                <p>No hay medicamentos próximos a vencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {medications?.filter(m => {
                   const expiry = new Date(m.expirationDate);
                   // Show expired or expiring in next 60 days
                   return differenceInDays(expiry, now) <= 60;
                })
                .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                .slice(0, 5)
                .map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="font-medium text-sm">{med.name}</p>
                      <p className="text-xs text-muted-foreground">{med.presentation}</p>
                    </div>
                    <div className="text-right">
                       <span className={`text-xs font-bold ${
                         !isAfter(new Date(med.expirationDate), now) ? 'text-red-600' : 'text-amber-600'
                       }`}>
                         {differenceInDays(new Date(med.expirationDate), now)} días
                       </span>
                       <p className="text-[10px] text-muted-foreground">restantes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
