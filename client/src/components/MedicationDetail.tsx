import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { type Medication, type Family } from "@shared/schema";
import { ExpiryBadge, StockBadge } from "./StatusBadges";
import { FileText, Activity, Pill, Clock, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MedicationDetailProps {
  medication: Medication & { family?: Family };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MedicationDetail({ medication, trigger, open, onOpenChange }: MedicationDetailProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden rounded-2xl">
        <div className="bg-primary px-6 py-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                  {medication.family?.name || "Sin Familia"}
                </span>
                <span className="text-xs">{medication.presentation}</span>
              </div>
              <h2 className="text-2xl font-display font-bold">{medication.name}</h2>
            </div>
            {medication.imageUrl && (
              <div className="h-16 w-16 rounded-lg bg-white p-1 shrink-0 overflow-hidden">
                <img src={medication.imageUrl} alt={medication.name} className="h-full w-full object-contain" />
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-8">
            {/* Status Section */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Inventario</p>
                  <StockBadge quantity={medication.quantity} />
                </div>
              </div>
              <Separator orientation="vertical" className="h-10 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vencimiento</p>
                  <ExpiryBadge date={medication.expirationDate} />
                </div>
              </div>
            </div>

            {/* Technical Details Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Activity className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Mecanismo de Acción</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {medication.mechanismOfAction || "No especificado."}
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Indicaciones</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {medication.indications || "No especificado."}
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Posología</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {medication.posology || "No especificado."}
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Pill className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Vía de Administración</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {medication.administrationRoute || "No especificado."}
                </p>
              </section>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
