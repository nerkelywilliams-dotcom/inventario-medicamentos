"use client"

import { useState } from "react";
import * as XLSX from "xlsx";
import { 
  useMedications, 
  useCreateMedication, 
  useUpdateMedication, 
  useDeleteMedication,
  useClearInventory // ✅ Agregado
} from "@/hooks/use-medications";
import { useFamilies } from "@/hooks/use-families";
import { useAuth } from "@/context/AuthContext";
import { useCreateLog } from "@/hooks/use-logs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// ✅ Agregados para la confirmación de borrado
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { MedicationForm } from "@/components/MedicationForm";
import { MedicationDetail } from "@/components/MedicationDetail";
import { ImportarCSV } from "@/components/ImportarCSV";
import { ExpiryBadge, StockBadge } from "@/components/StatusBadges";
import { Search, Plus, FileDown, Eye, Pencil, Trash2, FilterX, Tag, Baby, Loader2 } from "lucide-react";
import { format, isValid } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useSearch, Link } from "wouter";

export default function Inventory() {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false); // ✅ Estado para el modal de borrado
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const isUrlPediatricFilter = params.get("filter") === "pediatric";
  
  // Obtención de medicamentos
  const medicationsHook = useMedications({ 
    search: search || undefined,
    familyId: familyFilter !== "all" ? familyFilter : undefined 
  });
  const medications = (medicationsHook as any)?.data || [];
  const isLoading = (medicationsHook as any)?.isLoading;

  // Obtención de familias
  const familiesHook = useFamilies();
  const families = (familiesHook as any)?.data || [];
  
  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();
  const clearInventoryMutation = useClearInventory(); // ✅ Hook para vaciar inventario
  const createLog = useCreateLog();
  const { toast } = useToast();

  // Lógica para encontrar y preparar el medicamento a editar
  const editingMedication = medications?.find((m: any) => m.id === editingId);
  
  const formDefaultValues = editingMedication ? {
    ...editingMedication,
    name: editingMedication.catalog?.name || "",
    description: editingMedication.catalog?.description || "",
    actionMechanism: editingMedication.catalog?.actionMechanism || "",
    indications: editingMedication.catalog?.indications || "",
    posology: editingMedication.catalog?.posology || "",
    contraindications: editingMedication.catalog?.contraindications || "",
    interactions: editingMedication.catalog?.interactions || "",
    quantity: Number(editingMedication.quantity),
    expirationDate: editingMedication.expirationDate ? new Date(editingMedication.expirationDate) : new Date(),
    familyId: editingMedication.familyId?.toString()
  } : null;

  const filteredMedications = medications?.filter((med: any) => {
    const normalize = (str: string) => 
      str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const term = normalize(search);
    const name = normalize(med.catalog?.name || "");
    const presentation = normalize(med.presentation || "");

    if (isUrlPediatricFilter) {
      const matchesSearch = name.includes(term) || presentation.includes(term);
      return med.isPediatric === true && matchesSearch;
    }

    const isSearchingPediatric = term.startsWith("ped") || 
                                term.includes("nino") || 
                                term.includes("infantil") ||
                                term.includes("bebe");

    if (isSearchingPediatric) {
      return med.isPediatric === true;
    }

    return name.includes(term) || presentation.includes(term);
  });

  const handleExport = () => {
    if (!medications) return;
    const data = medications.map((m: any) => {
      const date = new Date(m.expirationDate);
      return {
        name: m.catalog?.name || "",
        dose: m.dose || "",
        presentation: m.presentation || "",
        quantity: m.quantity || 0,
        expirationDate: isValid(date) ? format(date, "yyyy-MM-dd") : "",
        isPediatric: m.isPediatric ? "TRUE" : "FALSE",
        familyId: m.familyId || "",
        description: m.catalog?.description || "",
        actionMechanism: m.catalog?.actionMechanism || "",
        indications: m.catalog?.indications || "",
        posology: m.catalog?.posology || "",
        contraindications: m.catalog?.contraindications || "",
        interactions: m.catalog?.interactions || "",
        _Familia_Visual: m.family?.name || "No asignada",
        _Estado_Stock: m.quantity === 0 ? "Agotado" : m.quantity < 10 ? "Bajo Stock" : "Disponible"
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `Inventario_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast({ title: "Plantilla Exportada", description: "El archivo Excel descargado sirve como plantilla para importar." });
  };

  const handleDelete = async (id: number) => {
    const medicationToDelete = medications?.find((m: any) => m.id === id);
    if (window.confirm(`¿Estás seguro de eliminar ${medicationToDelete?.catalog?.name}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteMutation.mutateAsync(id);
        if (user) {
          await createLog.mutateAsync({
            action: "ELIMINAR",
            details: `Se eliminó el medicamento: ${medicationToDelete?.catalog?.name || id}`,
            userId: user.id
          });
        }
      } catch (error) {
        // El toast de error ya lo maneja el hook
      }
    }
  };

  // ✅ Función para vaciar todo el inventario
  const handleClearAll = async () => {
    try {
      await clearInventoryMutation.mutateAsync();
      if (user) {
        await createLog.mutateAsync({
          action: "ELIMINAR",
          details: `Se vació TODO el inventario de la sede: ${user.inventoryLocation}`,
          userId: user.id
        });
      }
      setIsClearDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            {isUrlPediatricFilter ? (
              <span className="flex items-center gap-2 text-blue-600">
                <Baby className="h-8 w-8" /> Área Pediátrica
              </span>
            ) : (
              "Gestión de Farmacia"
            )}
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Sede: <span className="capitalize font-semibold text-primary">{user?.inventoryLocation === 'maracay' ? 'SSIA Maracay' : 'SSIA Magdaleno'}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isUrlPediatricFilter && (
            <Button asChild variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Link href="/inventory">Ver Todo el Inventario</Link>
            </Button>
          )}
          
          <Button variant="outline" onClick={handleExport} className="gap-2 border-primary/20 hover:bg-primary/5">
            <FileDown className="h-4 w-4" /> Exportar Excel
          </Button>

          {isAdmin && (
            <>
              {/* ✅ Implementación directa de Vaciar Inventario para asegurar funcionamiento */}
              <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 font-bold shadow-md">
                    <Trash2 className="h-4 w-4" /> Vaciar Inventario
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">¿Estás absolutamente segura?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará **TODOS** los medicamentos de esta sede. 
                      Esta operación no se puede deshacer y quedará registrada en el historial.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAll}
                      className="bg-destructive text-white hover:bg-destructive/90"
                      disabled={clearInventoryMutation.isPending}
                    >
                      {clearInventoryMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Borrando...
                        </>
                      ) : (
                        "Sí, vaciar todo el inventario"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <ImportarCSV />
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> Nuevo Medicamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Registrar Nuevo Ingreso</DialogTitle>
                  </DialogHeader>
                  <MedicationForm 
                    submitLabel="Registrar Medicamento"
                    isLoading={createMutation.isPending}
                    families={families}
                    onSubmit={async (data: any) => {
                      try {
                        await createMutation.mutateAsync(data);
                        if (user) {
                          await createLog.mutateAsync({
                            action: "CREAR",
                            details: `Se registró nuevo medicamento: ${data.name} (${data.dose})`,
                            userId: user.id
                          });
                        }
                        setIsCreateOpen(false);
                      } catch (e) {
                        // El toast de error ya lo maneja el hook
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={isUrlPediatricFilter ? "Buscar dentro de pediátricos..." : "Buscar por nombre, principio o escriba 'pediatrico'..."} 
            className="pl-9 border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={familyFilter} onValueChange={setFamilyFilter}>
            <SelectTrigger className="border-none bg-muted/50">
              <SelectValue placeholder="Filtrar por familia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Familias</SelectItem>
              {Array.isArray(families) && families.length > 0 ? (
                families.map((f: any) => (
                  <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No hay familias cargadas</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        {(search || familyFilter !== "all" || isUrlPediatricFilter) && (
          <Button variant="ghost" size="icon" onClick={() => { setSearch(""); setFamilyFilter("all"); }} title="Limpiar filtros">
             <FilterX className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold">Medicamento / Dosis</TableHead>
              <TableHead className="hidden md:table-cell font-bold">Familia</TableHead>
              <TableHead className="font-bold">Estado Stock</TableHead>
              <TableHead className="font-bold">Vencimiento</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredMedications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No se encontraron medicamentos {isUrlPediatricFilter ? "pediátricos" : ""} registrados.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedications?.map((med: any) => (
                <TableRow key={med.id} className={`group transition-colors hover:bg-primary/5 ${med.isPediatric ? "bg-sky-50/40" : ""}`}>
                  <TableCell>
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {med.catalog?.name} ({med.dose})
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{med.family?.name || "Sin asignar"}</TableCell>
                  <TableCell><StockBadge quantity={med.quantity} /></TableCell>
                  <TableCell><ExpiryBadge date={med.expirationDate} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDetailId(med.id)}><Eye className="h-4 w-4" /></Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(med.id)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(med.id)}><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {detailId && <MedicationDetail medication={medications.find((m:any) => m.id === detailId)} open={!!detailId} onOpenChange={() => setDetailId(null)} />}
      
      {editingId && (
        <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">Editar Medicamento</DialogTitle>
            </DialogHeader>
            {formDefaultValues ? (
              <MedicationForm 
                key={`edit-${editingId}`}
                families={families}
                defaultValues={formDefaultValues}
                isLoading={updateMutation.isPending}
                submitLabel="Guardar Cambios"
                onSubmit={async (data: any) => {
                  try {
                    const formattedData = {
                      ...data,
                      familyId: data.familyId ? parseInt(data.familyId) : undefined,
                      quantity: parseInt(data.quantity)
                    };

                    await updateMutation.mutateAsync({ id: editingId, ...formattedData });
                    
                    if (user) {
                      await createLog.mutateAsync({ 
                        action: "EDITAR", 
                        details: `Se actualizó el medicamento: ${data.name || formDefaultValues.name}`, 
                        userId: user.id 
                      });
                    }
                    
                    setEditingId(null);
                  } catch (e) {
                    console.error("Error al actualizar:", e);
                  }
                }}
              />
            ) : (
              <div className="p-10 text-center text-muted-foreground">
                Cargando datos del registro...
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
