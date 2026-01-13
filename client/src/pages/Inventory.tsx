import { useState } from "react";
import * as XLSX from "xlsx";
import { useMedications, useCreateMedication, useUpdateMedication, useDeleteMedication } from "@/hooks/use-medications";
import { useFamilies } from "@/hooks/use-families";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MedicationForm } from "@/components/MedicationForm";
import { MedicationDetail } from "@/components/MedicationDetail";
import { ExpiryBadge, StockBadge } from "@/components/StatusBadges";
import { Search, Plus, MoreHorizontal, FileDown, Eye, Pencil, Trash2, FilterX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { data: medications, isLoading } = useMedications({ 
    search: search || undefined,
    familyId: familyFilter !== "all" ? familyFilter : undefined 
  });
  const { data: families } = useFamilies();
  
  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();
  const { toast } = useToast();

  const handleExport = () => {
    if (!medications) return;

    const data = medications.map(m => ({
      Nombre: m.name,
      Familia: m.family?.name || "N/A",
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
    if (confirm("¿Estás seguro de eliminar este medicamento?")) {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Eliminado", description: "El medicamento ha sido eliminado." });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Gestión de Farmacia</h2>
          <p className="text-muted-foreground">Gestión de stock y fichas técnicas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <FileDown className="h-4 w-4" /> Exportar
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Nuevo Medicamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Medicamento</DialogTitle>
              </DialogHeader>
              <MedicationForm 
                submitLabel="Registrar Medicamento"
                isLoading={createMutation.isPending}
                onSubmit={async (data) => {
                  await createMutation.mutateAsync(data);
                  setIsCreateOpen(false);
                  toast({ title: "Éxito", description: "Medicamento registrado correctamente." });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre..." 
            className="pl-9 border-none bg-muted/50 focus-visible:ring-0 focus-visible:bg-muted"
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
          <Button variant="ghost" size="icon" onClick={() => { setSearch(""); setFamilyFilter("all"); }}>
            <FilterX className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Nombre / Presentación</TableHead>
              <TableHead className="hidden md:table-cell">Familia</TableHead>
              <TableHead>Estado Stock</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="w-[50px]"></TableHead>
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
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : medications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No se encontraron medicamentos.
                </TableCell>
              </TableRow>
            ) : (
              medications?.map((med) => (
                <TableRow key={med.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {med.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{med.presentation}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                      {med.family?.name || "Sin Familia"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StockBadge quantity={med.quantity} />
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge date={med.expirationDate} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> Ver Ficha
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-0">
                             <MedicationDetail medication={med} />
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={editingId === med.id} onOpenChange={(open) => setEditingId(open ? med.id : null)}>
                          <DialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Medicamento</DialogTitle>
                            </DialogHeader>
                            <MedicationForm 
                              defaultValues={med}
                              submitLabel="Guardar Cambios"
                              isLoading={updateMutation.isPending}
                              onSubmit={async (data) => {
                                await updateMutation.mutateAsync({ id: med.id, ...data });
                                setEditingId(null);
                                toast({ title: "Actualizado", description: "Cambios guardados correctamente." });
                              }}
                            />
                          </DialogContent>
                        </Dialog>

                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
