import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type Medication, type Family } from "@shared/schema";
import { ExpiryBadge, StockBadge } from "./StatusBadges";
import { 
  FileText, 
  Activity, 
  Pill, 
  Clock, 
  AlertTriangle, 
  Package, 
  Calendar, 
  Syringe, 
  Loader2,
  AlertOctagon,
  RefreshCw,
  Tag
} from "lucide-react";
import { useEffect, useState } from "react";

interface MedicationDetailProps {
  medication: Medication & { family?: Family };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  fetchFullData?: (id: number) => Promise<Medication & { family?: Family }>;
}

export function MedicationDetail({ 
  medication: initialMedication, 
  trigger, 
  open, 
  onOpenChange,
  fetchFullData 
}: MedicationDetailProps) {
  const [medication, setMedication] = useState(initialMedication);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedFullData, setHasLoadedFullData] = useState(false);

  useEffect(() => {
    if (open && fetchFullData && !hasLoadedFullData) {
      const needsFullData = !initialMedication.administrationRoute || 
                            !initialMedication.mechanismOfAction || 
                            !initialMedication.indications;
      
      if (needsFullData) {
        setIsLoading(true);
        fetchFullData(initialMedication.id)
          .then(fullData => {
            setMedication(fullData);
            setHasLoadedFullData(true);
          })
          .catch(error => console.error("Error cargando ficha técnica:", error))
          .finally(() => setIsLoading(false));
      }
    }
  }, [open, fetchFullData, hasLoadedFullData, initialMedication]);

  useEffect(() => {
    setMedication(initialMedication);
    setHasLoadedFullData(false);
  }, [initialMedication]);

  const safeMedication = {
    ...medication,
    dose: medication.dose || "No especificada",
    administrationRoute: medication.administrationRoute || "No especificada",
    mechanismOfAction: medication.mechanismOfAction || "No especificado",
    indications: medication.indications || "No especificadas",
    posology: medication.posology || "No especificada",
    contraindications: medication.contraindications || "Sin contraindicaciones registradas",
    interactions: medication.interactions || "Sin interacciones registradas",
    description: medication.description || "Sin descripción adicional",
  };

  const formatExpiryDate = (date: Date | string) => {
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return "Fecha no disponible";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden border-none shadow-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Consultando Vademécum interno...</p>
          </div>
        ) : (
          <>
            {/* Header Médico con Gradiente */}
            <div className="bg-gradient-to-br from-primary via-primary/90 to-blue-700 px-8 py-10 text-primary-foreground relative">
              <div className="absolute top-4 right-8 opacity-10">
                <Activity className="h-24 w-24" />
              </div>
              
              <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {safeMedication.family?.name && (
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md uppercase text-[10px] tracking-widest font-bold">
                        <Tag className="h-3 w-3 mr-1" /> {safeMedication.family.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-white border-white/40 font-normal">
                      {safeMedication.presentation}
                    </Badge>
                  </div>
                  
                  <div>
                    <h2 className="text-4xl font-black tracking-tight leading-none mb-2">
                      {safeMedication.name}
                    </h2>
                    <p className="text-primary-foreground/80 text-lg font-medium flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Concentración: {safeMedication.dose}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-sm font-medium pt-2">
                    <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full">
                      <Calendar className="h-4 w-4" />
                      <span>Expira: {formatExpiryDate(safeMedication.expirationDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full">
                      <Syringe className="h-4 w-4" />
                      <span>Vía {safeMedication.administrationRoute}</span>
                    </div>
                  </div>
                </div>

                {safeMedication.imageUrl && (
                  <div className="h-32 w-32 rounded-2xl bg-white p-3 shrink-0 shadow-2xl border border-white/20 transform md:rotate-3">
                    <img 
                      src={safeMedication.imageUrl} 
                      alt={safeMedication.name} 
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="max-h-[calc(95vh-240px)] bg-background">
              <div className="p-8 space-y-10">
                
                {/* Dashboard de Estado Rápido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl text-primary">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Stock Disponible</p>
                        <p className="text-2xl font-black">{safeMedication.quantity} <span className="text-sm font-medium text-muted-foreground">unidades</span></p>
                      </div>
                    </div>
                    <StockBadge quantity={safeMedication.quantity} />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Estado de Alerta</p>
                        <p className="text-sm font-semibold">Revisar fecha de vencimiento</p>
                      </div>
                    </div>
                    <ExpiryBadge date={safeMedication.expirationDate} />
                  </div>
                </div>

                {/* Información Farmacológica Principal */}
                <div className="grid md:grid-cols-2 gap-10">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                      <Activity className="h-5 w-5" />
                      <h4 className="font-bold text-lg uppercase tracking-tight">Farmacodinamia</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mecanismo de Acción</label>
                        <p className="text-sm leading-relaxed mt-1 text-foreground/90">{safeMedication.mechanismOfAction}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Indicaciones Terapéuticas</label>
                        <p className="text-sm leading-relaxed mt-1 text-foreground/90">{safeMedication.indications}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                      <FileText className="h-5 w-5" />
                      <h4 className="font-bold text-lg uppercase tracking-tight">Administración</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Posología Recomendada</label>
                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 mt-1">
                          <p className="text-sm leading-relaxed text-blue-900 font-medium">{safeMedication.posology}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descripción del Fármaco</label>
                        <p className="text-sm leading-relaxed mt-1 text-foreground/80 italic">{safeMedication.description}</p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sección Crítica: Seguridad */}
                <div className="bg-destructive/5 rounded-3xl border border-destructive/20 overflow-hidden">
                  <div className="bg-destructive/10 px-6 py-3 flex items-center gap-2 text-destructive font-black uppercase text-xs tracking-widest">
                    <AlertOctagon className="h-4 w-4" />
                    Protocolo de Seguridad y Contraindicaciones
                  </div>
                  <div className="p-8 grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <h5 className="text-sm font-bold flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" /> Contraindicaciones Absolutas
                      </h5>
                      <p className="text-sm leading-relaxed text-foreground font-medium p-4 bg-white rounded-xl border border-destructive/10">
                        {safeMedication.contraindications}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-sm font-bold flex items-center gap-2 text-amber-600">
                        <RefreshCw className="h-4 w-4" /> Interacciones Medicamentosas
                      </h5>
                      <p className="text-sm leading-relaxed text-foreground p-4 bg-white rounded-xl border border-amber-200/50">
                        {safeMedication.interactions}
                      </p>
                    </div>
                  </div>
                  <div className="px-8 pb-6 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
                      *** Documento generado para uso interno - SSIA Farmacia ***
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}