"use client"

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  useMedications, 
  useCreateMedication, 
  useUpdateMedication, 
  useDeleteMedication,
  useClearInventory,
  useBulkCreateMedications 
} from "@/hooks/use-medications";
import { useFamilies } from "@/hooks/use-families";
import { useAuth } from "@/context/AuthContext";
import { useCreateLog } from "@/hooks/use-logs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { ExpiryBadge, StockBadge } from "@/components/StatusBadges";
import { Search, Plus, FileDown, Eye, Pencil, Trash2, Baby, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSearch, Link } from "wouter";

export default function Inventory() {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const isUrlPediatricFilter = params.get("filter") === "pediatric";
  
  const medicationsHook = useMedications({ 
    search: search || undefined,
    familyId: familyFilter !== "all" ? familyFilter : undefined 
  });
  const medications = (medicationsHook as any)?.data || [];
  const isLoading = (medicationsHook as any)?.isLoading;

  const familiesHook = useFamilies();
  const families = (familiesHook as any)?.data || [];
  
  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();
  const clearInventoryMutation = useClearInventory();
  const bulkCreateMutation = useBulkCreateMedications();
  const createLog = useCreateLog();
  const { toast } = useToast();

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
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const term = normalize(search);
    const name = normalize(med.catalog?.name || "");
    const presentation = normalize(med.presentation || "");

    if (isUrlPediatricFilter) return med.isPediatric === true && (name.includes(term) || presentation.includes(term));
    const isSearchingPediatric = term.startsWith("ped") || term.includes("nino") || term.includes("infantil") || term.includes("bebe");
    if (isSearchingPediatric) return med.isPediatric === true;
    return name.includes(term) || presentation.includes(term);
  });

  const handleExport = () => {
    if (!medications) return;
    const data = medications.map((m: any) => ({
      name: m.catalog?.name || "",
      dose: m.dose || "",
      presentation: m.presentation || "",
      quantity: m.quantity || 0,
      expirationDate: m.expirationDate ? format(new Date(m.expirationDate), "yyyy-MM-dd") : "",
      isPediatric: m.isPediatric ? "TRUE" : "FALSE",
      familyId: m.familyId || "",
      description: m.catalog?.description || "",
      administrationRoute: m.catalog?.administrationRoute || "",
      actionMechanism: m.catalog?.mechanismOfAction || "",
      indications: m.catalog?.indications || "",
      posology: m.catalog?.posology || "",
      contraindications: m.catalog?.contraindications || "",
      interactions: m.catalog?.interactions || ""
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `Plantilla_Medistock_${user?.inventoryLocation}.xlsx`);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
        const wsname = wb.SheetNames[0];
        const rawData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wsname], { raw: false, defval: "" });

        const familyMap = new Map(families.map((f: any) => [f.name.toLowerCase().trim(), f.id]));
        const validFamilyIds = new Set(families.map((f: any) => Number(f.id)));

        const normalizeKey = (key: string) =>
          String(key || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9]/gi, "");

        const getCell = (row: any, ...keys: string[]) => {
          for (const key of keys) {
            const normalized = normalizeKey(key);
            const found = Object.keys(row).find((rawKey) => normalizeKey(rawKey) === normalized);
            if (found && row[found] !== "") return row[found];
          }
          return undefined;
        };

        const formattedData = rawData.map((row: any) => {
          const rawFamily = getCell(row, "familyId", "familia", "id_familia", "familiavisual", "familia visual");
          let familyId: number | null = null;

          if (rawFamily !== undefined && rawFamily !== null && rawFamily !== "") {
            if (typeof rawFamily === "number") {
              familyId = validFamilyIds.has(rawFamily) ? rawFamily : null;
            } else if (!isNaN(Number(rawFamily))) {
              const parsed = Number(rawFamily);
              familyId = validFamilyIds.has(parsed) ? parsed : null;
            } else {
              familyId = familyMap.get(String(rawFamily).toLowerCase().trim()) || null;
            }
          }

          const rawExpiration = getCell(row, "expirationDate", "fechaexpiracion", "fechadevencimiento", "vencimiento", "fecha_vencimiento");
          let dateValue: string;
          try {
            if (rawExpiration instanceof Date) {
              dateValue = rawExpiration.toISOString();
            } else if (rawExpiration) {
              const parsedDate = new Date(rawExpiration);
              dateValue = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
            } else {
              dateValue = new Date().toISOString();
            }
          } catch {
            dateValue = new Date().toISOString();
          }

          const rawQuantity = getCell(row, "quantity", "cantidad", "stock");
          const rawPediatric = getCell(row, "isPediatric", "pediatric", "pediatrico", "esPediatrico", "es_pediatrico");

          return {
            name: String(getCell(row, "name", "nombre", "medicamento") || "Sin Nombre").trim(),
            dose: String(getCell(row, "dose", "dosis") || "N/A").trim(),
            presentation: String(getCell(row, "presentation", "presentacion") || "N/A").trim(),
            quantity: Number(rawQuantity || 0),
            expirationDate: dateValue,
            isPediatric: ["true", "sí", "si", "yes", "1"].includes(String(rawPediatric || "").trim().toLowerCase()),
            familyId,
            description: String(getCell(row, "description", "descripcion", "descripción", "descripciongeneral", "descripcióngeneral", "descripcion general", "descripción general") || "").trim(),
            administrationRoute: String(getCell(row, "administrationRoute", "via", "vía", "route", "ruta", "administracion") || "").trim(),
            actionMechanism: String(getCell(row, "actionMechanism", "accion", "mecanismodeaccion", "mecanismo") || "").trim(),
            indications: String(getCell(row, "indications", "indicaciones") || "").trim(),
            posology: String(getCell(row, "posology", "posologia") || "").trim(),
            contraindications: String(getCell(row, "contraindications", "contraindicaciones") || "No especificadas").trim(),
            interactions: String(getCell(row, "interactions", "interacciones") || "No especificadas").trim(),
          };
        });

        await bulkCreateMutation.mutateAsync(formattedData);
        if (user) await createLog.mutateAsync({ action: "CREAR", details: `Importación masiva: ${formattedData.length} ítems.`, userId: user.id });
      } catch (error: any) {
        console.error("Error detallado:", error);
        toast({ 
          variant: "destructive", 
          title: "Error de Importación", 
          description: error.message || "Revisa el formato de tu Excel." 
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDelete = async (id: number) => {
    const med = medications?.find((m: any) => m.id === id);
    if (window.confirm(`¿Eliminar ${med?.catalog?.name}?`)) {
      await deleteMutation.mutateAsync(id);
      if (user) await createLog.mutateAsync({ action: "ELIMINAR", details: `Eliminado: ${med?.catalog?.name}`, userId: user.id });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearInventoryMutation.mutateAsync();
      if (user) await createLog.mutateAsync({ action: "ELIMINAR", details: "Vaciado de inventario", userId: user.id });
      setIsClearDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al vaciar", description: error.message });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            {isUrlPediatricFilter ? <span className="flex items-center gap-2 text-blue-600"><Baby className="h-8 w-8" /> Área Pediátrica</span> : "Gestión de Farmacia"}
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Sede: <span className="capitalize font-semibold text-primary">{user?.inventoryLocation === 'maracay' ? 'SSIA Maracay' : 'SSIA Magdaleno'}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isUrlPediatricFilter && (
            <Button asChild variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Link href="/inventory">Ver Todo</Link>
            </Button>
          )}
          
          <Button variant="outline" onClick={handleExport} className="gap-2 border-primary/20">
            <FileDown className="h-4 w-4" /> Exportar/Plantilla
          </Button>

          {isAdmin && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />
              <Button 
                variant="outline" 
                onClick={handleImportClick} 
                className="gap-2 border-green-600 text-green-700 hover:bg-green-50 shadow-sm"
                disabled={bulkCreateMutation.isPending}
              >
                {bulkCreateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar Excel
              </Button>

              <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 font-bold"><Trash2 className="h-4 w-4" /> Vaciar Inventario</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">¿Estás absolutamente segura?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán permanentemente todos los medicamentos de esta sede.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={(e) => {
                        e.preventDefault();
                        handleClearAll();
                      }} 
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={clearInventoryMutation.isPending}
                    >
                      {clearInventoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sí, borrar todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> Nuevo</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="text-2xl font-bold text-primary">Registrar Nuevo</DialogTitle></DialogHeader>
                  <MedicationForm 
                    submitLabel="Registrar" 
                    isLoading={createMutation.isPending} 
                    families={families}
                    onSubmit={async (data) => {
                      await createMutation.mutateAsync(data);
                      if (user) await createLog.mutateAsync({ action: "CREAR", details: `Nuevo: ${data.name}`, userId: user.id });
                      setIsCreateOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, principio o escriba 'pediatrico'..." 
            className="pl-9 border-none bg-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={familyFilter} onValueChange={setFamilyFilter}>
            <SelectTrigger className="border-none bg-muted/50"><SelectValue placeholder="Todas las Familias" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Familias</SelectItem>
              {families.map((f: any) => (<SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold">Medicamento / Dosis</TableHead>
              <TableHead className="hidden md:table-cell font-bold">Familia</TableHead>
              <TableHead className="font-bold">Stock</TableHead>
              <TableHead className="font-bold">Vencimiento</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : filteredMedications?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Sin resultados.</TableCell></TableRow>
            ) : (
              filteredMedications.map((med: any) => (
                <TableRow key={med.id} className={`group transition-colors hover:bg-primary/5 ${med.isPediatric ? "bg-sky-50/40" : ""}`}>
                  <TableCell className="font-semibold">{med.catalog?.name} ({med.dose})</TableCell>
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
            <DialogHeader><DialogTitle className="text-2xl font-bold text-primary">Editar Registro</DialogTitle></DialogHeader>
            {formDefaultValues && (
              <MedicationForm 
                key={`edit-${editingId}`}
                families={families}
                defaultValues={formDefaultValues}
                isLoading={updateMutation.isPending}
                submitLabel="Guardar"
                onSubmit={async (data: any) => {
                  const fmt = { ...data, familyId: data.familyId ? parseInt(data.familyId) : undefined, quantity: parseInt(data.quantity) };
                  await updateMutation.mutateAsync({ id: editingId, ...fmt });
                  if (user) await createLog.mutateAsync({ action: "EDITAR", details: `Editado: ${data.name}`, userId: user.id });
                  setEditingId(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
