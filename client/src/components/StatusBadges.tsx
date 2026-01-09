import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface ExpiryBadgeProps {
  date: Date | string;
}

export function ExpiryBadge({ date }: ExpiryBadgeProps) {
  const expiry = new Date(date);
  const now = new Date();
  const daysUntilExpiry = differenceInDays(expiry, now);
  
  let status: 'expired' | 'warning' | 'good' = 'good';
  let label = format(expiry, "d MMM yyyy", { locale: es });
  let Icon = CheckCircle2;

  if (daysUntilExpiry < 0) {
    status = 'expired';
    label = 'Vencido';
    Icon = AlertCircle;
  } else if (daysUntilExpiry < 30) {
    status = 'warning';
    label = `Vence en ${daysUntilExpiry} días`;
    Icon = Clock;
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      status === 'expired' && "bg-red-50 text-red-700 border-red-200",
      status === 'warning' && "bg-amber-50 text-amber-700 border-amber-200",
      status === 'good' && "bg-emerald-50 text-emerald-700 border-emerald-200",
    )}>
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

interface StockBadgeProps {
  quantity: number;
}

export function StockBadge({ quantity }: StockBadgeProps) {
  let status: 'out' | 'low' | 'good' = 'good';
  let label = 'Disponible';

  if (quantity === 0) {
    status = 'out';
    label = 'Agotado';
  } else if (quantity < 10) {
    status = 'low';
    label = 'Bajo Stock';
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      status === 'out' && "bg-slate-100 text-slate-600 border-slate-200",
      status === 'low' && "bg-orange-50 text-orange-700 border-orange-200",
      status === 'good' && "bg-blue-50 text-blue-700 border-blue-200",
    )}>
      <span className="font-bold">{quantity}</span>
      {status !== 'good' && <span>{label}</span>}
      {status === 'good' && <span>unidades</span>}
    </div>
  );
}
