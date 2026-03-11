"use client"

import { useState } from "react";
import * as XLSX from "xlsx";
import { useMedications, useCreateMedication, useUpdateMedication, useDeleteMedication } from "@/hooks/use-medications";
import { useFamilies } from "@/hooks/use-families";
import { useAuth } from "@/context/AuthContext";
import { useCreateLog } from "@/hooks/use-logs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MedicationForm } from "@/components/MedicationForm";
import { MedicationDetail } from "@/components/MedicationDetail";
import { ImportarCSV } from "@/components/ImportarCSV";
import { BorrarInventario } from "@/components/BorrarInventario"; // ✅ AGREGADO
import { ExpiryBadge, StockBadge } from "@/components/StatusBadges";
import { Search, Plus, FileDown, Eye, Pencil, Trash2, FilterX, Tag, Baby } from "lucide-react";
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
  
  // Diagnóstico en consola
  console.log("Datos de familias en Inventory:", families);

  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();
  const createLog = useCreateLog();
  const { toast } = useToast();

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
        Nombre: m.catalog?.name || "Sin nombre",
        Dosis: m.dose,
        Pediátrico: m.isPediatric ? "Sí" : "No",
        Familia: m.family?.name || "No asignada",
        Presentacion: m.presentation,
        Cantidad: m.quantity,
        Vencimiento: isValid(date) ? format(date, "yyyy-MM-dd") : "Fecha inválida",
        Estado: m.quantity === 0 ? "Agotado" : m.quantity < 10 ? "Bajo Stock" : "Disponible"
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `Inventario_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast({ title: "Exportación exitosa", description: "El archivo Excel se ha descargado." });
  };

  const handleDelete = async (id: number) => {
    const medicationToDelete = medications?.find((m: any) => m.id === id);
    if (window.confirm(`¿Estás seguro de eliminar ${medicationToDelete?.catalog?.name}? Esta acción no se puede deshacer.`)) {
      await deleteMutation.mutateAsync(id);
      
      if (user) {
        createLog.mutate({
          action: "ELIMINAR",
          details: `Se eliminó el medicamento: ${medicationToDelete?.catalog?.name || id}`,
          userId: user.id
        });
      }

      toast({ title: "Eliminado", description: "El registro ha sido removido del sistema." });
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
              <BorrarInventario /> {/* ✅ AGREGADO: Componente de borrado masivo */}
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
                      await createMutation.mutateAsync(data);
                      
                      if (user) {
                        createLog.mutate({
                          action: "CREAR",
                          details: `Se registró nuevo medicamento: ${data.name} (${data.dose})`,
                          userId: user.id
                        });
                      }

                      setIsCreateOpen(false);
                      toast({ title: "Éxito", description: "Medicamento registrado correctamente." });
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
                  No se encontraron medicamentos {isUrlPediatricFilter ? "pediátricos" : ""} registrados en esta sede.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedications?.map((med: any) => (
                <TableRow 
                  key={med.id} 
                  className={`group transition-colors hover:bg-primary/5 ${med.isPediatric ? "bg-sky-50/40" : ""}`}
                >
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        {med.catalog?.name} 
                        <span className="text-muted-foreground font-normal">({med.dose})</span>
                        {med.isPediatric && (
                          <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-200 text-[10px] font-black uppercase px-2 py-0 h-5 flex items-center gap-0.5 whitespace-nowrap">
                            <Baby className="h-3 w-3" /> Pediátrico
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground italic">{med.presentation}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {med.family ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold border border-primary/20 uppercase tracking-wider">
                        <Tag className="h-3 w-3" />
                        {med.family.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StockBadge quantity={med.quantity} />
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge date={med.expirationDate} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Dialog open={detailId === med.id} onOpenChange={(open) => setDetailId(open ? med.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <MedicationDetail medication={med} open={detailId === med.id} onOpenChange={(open) => setDetailId(open ? med.id : null)} />
                      </Dialog>
                      
                      {isAdmin && (
                        <>
                          <Dialog open={editingId === med.id} onOpenChange={(open) => setEditingId(open ? med.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-amber-600">Editar Registro Médico</DialogTitle>
                              </DialogHeader>
                              <MedicationForm 
                                families={families}
                                defaultValues={{
                                  name: med.catalog?.name ?? "",
                                  dose: med.dose,
                                  presentation: med.presentation,
                                  quantity: med.quantity,
                                  expirationDate: med.expirationDate ?? undefined,
                                  description: med.catalog?.description ?? "",
                                  mechanismOfAction: med.catalog?.mechanismOfAction ?? "",
                                  indications: med.catalog?.indications ?? "",
                                  posology: med.catalog?.posology ?? "",
                                  administrationRoute: med.catalog?.administrationRoute ?? "",
                                  contraindications: med.catalog?.contraindications ?? "",
                                  interactions: med.catalog?.interactions ?? "",
                                  isPediatric: med.isPediatric ?? false,
                                  familyId: med.familyId || undefined,
                                  imageUrl: med.catalog?.imageUrl ?? "",
                                }}
                                submitLabel="Guardar Cambios"
                                isLoading={updateMutation.isPending}
                                onSubmit={async (data: any) => {
                                  await updateMutation.mutateAsync({ id: med.id, ...data });
                                  if (user) {
                                    createLog.mutate({
                                      action: "EDITAR",
                                      details: `Se modificó información de: ${med.catalog?.name}`,
                                      userId: user.id
                                    });
                                  }
                                  setEditingId(null);
                                  toast({ title: "Actualizado", description: "Cambios aplicados." });
                                }}
                              />
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={() => handleDelete(med.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
