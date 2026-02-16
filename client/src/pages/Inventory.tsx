import { useState } from "react";
import * as XLSX from "xlsx";
import { useMedications, useCreateMedication, useUpdateMedication, useDeleteMedication } from "@/hooks/use-medications";
import { useFamilies } from "@/hooks/use-families";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MedicationForm } from "@/components/MedicationForm";
import { MedicationDetail } from "@/components/MedicationDetail";
import { ExpiryBadge, StockBadge } from "@/components/StatusBadges";
import { Search, Plus, FileDown, Eye, Pencil, Trash2, FilterX, Tag, Baby } from "lucide-react"; // ✅ Añadido Baby icon
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; // ✅ Añadido Badge

export default function Inventory() {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  
  const { data: medications, isLoading } = useMedications({ 
    search: search || undefined,
    familyId: familyFilter !== "all" ? familyFilter : undefined 
  });
  const { data: families } = useFamilies();
  
  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();
  const { toast } = useToast();

  // ✅ FILTRADO MEJORADO: Ahora permite buscar por la palabra "pediatrico"
  const filteredMedications = medications?.filter(med => {
    const searchTerm = search.toLowerCase();
    const matchesText = med.name.toLowerCase().includes(searchTerm) || 
                       med.presentation.toLowerCase().includes(searchTerm);
    
    const matchesPediatricTag = (searchTerm.includes("pediat") || searchTerm.includes("niño")) 
      ? med.isPediatric 
      : false;

    return matchesText || matchesPediatricTag;
  });

  const handleExport = () => {
    if (!medications) return;
    const data = medications.map(m => ({
      Nombre: m.name,
      Dosis: m.dose,
      Pediátrico: m.isPediatric ? "Sí" : "No", // ✅ Añadido al Excel
      Familia: m.family?.name || "No asignada",
      Presentacion: m.presentation,
      Cantidad: m.quantity,
      Vencimiento: format(new Date(m.expirationDate), "yyyy-MM-dd"),
      Estado: m.quantity === 0 ? "Agotado" : m.quantity < 10 ? "Bajo Stock" : "Disponible"
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `Inventario_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast({ title: "Exportación exitosa", description: "El archivo Excel se ha descargado." });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este medicamento? Esta acción no se puede deshacer.")) {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Eliminado", description: "El registro ha sido removido del sistema." });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Gestión de Farmacia</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Sede: <span className="capitalize font-semibold text-primary">{user?.inventoryLocation === 'maracay' ? 'SSIA Maracay' : 'SSIA Magdaleno'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2 border-primary/20 hover:bg-primary/5">
            <FileDown className="h-4 w-4" /> Exportar Excel
          </Button>
          {isAdmin && (
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
                  onSubmit={async (data) => {
                    await createMutation.mutateAsync(data);
                    setIsCreateOpen(false);
                    toast({ title: "Éxito", description: "Medicamento registrado correctamente en el inventario." });
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, principio o escriba 'pediatrico'..." 
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
              {families?.map(f => (
                <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(search || familyFilter !== "all") && (
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
                  No se encontraron medicamentos registrados en esta sede.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedications?.map((med) => (
                <TableRow key={med.id} className="group hover:bg-primary/5 transition-colors">
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        {med.name} 
                        <span className="text-muted-foreground font-normal">({med.dose})</span>
                        {/* ✅ BADGE PEDIÁTRICO AÑADIDO */}
                        {med.isPediatric && (
                          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-sky-200 text-[10px] font-black uppercase px-2 py-0 h-5 flex items-center gap-0.5">
                            <Baby className="h-2.5 w-2.5" /> Pediátrico
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
                                defaultValues={med}
                                submitLabel="Guardar Cambios"
                                isLoading={updateMutation.isPending}
                                onSubmit={async (data) => {
                                  await updateMutation.mutateAsync({ id: med.id, ...data });
                                  setEditingId(null);
                                  toast({ title: "Actualizado", description: "Los cambios han sido aplicados con éxito." });
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