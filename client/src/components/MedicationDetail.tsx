import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
  AlertOctagon, // Nuevo
  RefreshCw      // Nuevo
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
          .catch(error => {
            console.error("Error cargando datos completos:", error);
          })
          .finally(() => {
            setIsLoading(false);
          });
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
    contraindications: medication.contraindications || "No especificadas", // Nuevo
    interactions: medication.interactions || "No especificadas",           // Nuevo
    description: medication.description || "Sin descripción",
    imageUrl: medication.imageUrl || "",
  };

  const formatExpiryDate = (date: Date | string) => {
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return "Fecha no disponible";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Cargando ficha técnica...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-primary to-primary/90 px-8 py-8 text-primary-foreground">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {safeMedication.family?.name && (
                      <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                        {safeMedication.family.name}
                      </Badge>
                    )}
                    <span className="text-sm opacity-90 bg-white/10 px-3 py-1 rounded-full">
                      {safeMedication.presentation}
                    </span>
                    <Badge className="bg-white text-primary hover:bg-white font-bold border-0 shadow-sm">
                      Dosis: {safeMedication.dose}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight mb-2">{safeMedication.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>Familia: {safeMedication.family?.name || "Sin familia asignada"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Vence: {formatExpiryDate(safeMedication.expirationDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Syringe className="h-3 w-3" />
                      <span>Vía: {safeMedication.administrationRoute}</span>
                    </div>
                  </div>
                </div>
                
                {safeMedication.imageUrl && (
                  <div className="h-24 w-24 rounded-xl bg-white p-2 shrink-0 overflow-hidden shadow-lg border border-white/20">
                    <img 
                      src={safeMedication.imageUrl} 
                      alt={safeMedication.name} 
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-medication.png";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="max-h-[calc(90vh-180px)]">
              <div className="p-8 space-y-8">
                {/* Grid de Estado con Dosis Resaltada */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-br from-muted/20 to-muted/5 rounded-2xl border border-border/30">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Inventario</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StockBadge quantity={safeMedication.quantity} />
                        <span className="text-lg font-semibold">{safeMedication.quantity} unidades</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-xl border border-primary/20 shadow-sm">
                    <div className="bg-primary p-3 rounded-full text-white">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mb-1">Dosis Recomendada</p>
                      <p className="text-xl font-black text-primary leading-tight">{safeMedication.dose}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Vencimiento</p>
                      <div className="mt-1">
                        <ExpiryBadge date={safeMedication.expirationDate} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de Descripción */}
                {safeMedication.description && safeMedication.description !== "Sin descripción" && (
                  <section className="space-y-3">
                    <h3 className="font-semibold text-xl flex items-center gap-2 text-primary">
                      <FileText className="h-5 w-5" />
                      Descripción General
                    </h3>
                    <div className="p-4 bg-muted/10 rounded-lg border">
                      <p className="text-foreground leading-relaxed">{safeMedication.description}</p>
                    </div>
                  </section>
                )}

                {/* Ficha Técnica: Mecanismo, Posología, Indicaciones */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-2xl border-b pb-2">Información Clínica</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Activity className="h-5 w-5" />
                          <h4 className="font-semibold text-lg">Mecanismo de Acción</h4>
                        </div>
                        <div className="p-4 bg-muted/10 rounded-lg border">
                          <p className="text-foreground leading-relaxed">{safeMedication.mechanismOfAction}</p>
                        </div>
                      </section>
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <FileText className="h-5 w-5" />
                          <h4 className="font-semibold text-lg">Posología</h4>
                        </div>
                        <div className="p-4 bg-muted/10 rounded-lg border">
                          <p className="text-foreground leading-relaxed">{safeMedication.posology}</p>
                        </div>
                      </section>
                    </div>
                    <div className="space-y-6">
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <AlertTriangle className="h-5 w-5" />
                          <h4 className="font-semibold text-lg">Indicaciones</h4>
                        </div>
                        <div className="p-4 bg-muted/10 rounded-lg border">
                          <p className="text-foreground leading-relaxed">{safeMedication.indications}</p>
                        </div>
                      </section>
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Pill className="h-5 w-5" />
                          <h4 className="font-semibold text-lg">Vía de Administración</h4>
                        </div>
                        <div className="p-4 bg-muted/10 rounded-lg border">
                          <p className="text-foreground leading-relaxed">{safeMedication.administrationRoute}</p>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                {/* NUEVO: SECCIÓN DE SEGURIDAD Y ALERTAS (CRÍTICO) */}
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="font-semibold text-2xl text-destructive flex items-center gap-2">
                    <AlertOctagon className="h-6 w-6" />
                    Seguridad del Paciente
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-destructive font-bold">
                        <AlertOctagon className="h-5 w-5" />
                        <h4 className="text-lg">Contraindicaciones</h4>
                      </div>
                      <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/10 min-h-[100px]">
                        <p className="text-foreground leading-relaxed italic">
                          {safeMedication.contraindications}
                        </p>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-600 font-bold">
                        <RefreshCw className="h-5 w-5" />
                        <h4 className="text-lg">Interacciones</h4>
                      </div>
                      <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 min-h-[100px]">
                        <p className="text-foreground leading-relaxed">
                          {safeMedication.interactions}
                        </p>
                      </div>
                    </section>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center italic mt-4">
                    * Esta información es de carácter referencial. Verifique siempre con el prospecto oficial del fármaco.
                  </p>
                </div>

                {/* Footer Resumen */}
                <div className="pt-6 border-t pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg">
                      <Activity className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-[11px] uppercase opacity-70">Dosis</p>
                        <p className="font-semibold truncate">{safeMedication.dose}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-[11px] uppercase opacity-70">Tipo</p>
                        <p className="text-muted-foreground truncate">{safeMedication.presentation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-[11px] uppercase opacity-70">Vence</p>
                        <p className="text-muted-foreground">{new Date(safeMedication.expirationDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg">
                      <Syringe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-[11px] uppercase opacity-70">Vía</p>
                        <p className="text-muted-foreground truncate">{safeMedication.administrationRoute}</p>
                      </div>
                    </div>
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