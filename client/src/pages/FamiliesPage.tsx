"use client"

import { useState, useMemo } from "react";
import { useFamilies } from "@/hooks/use-families";
import { useMedications } from "@/hooks/use-medications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FamilyCard } from "@/components/FamilyCard";
import { FamilyForm } from "@/components/FamilyForm";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  SortAsc, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function FamiliesPage() {
  // 1. Llamada a los hooks de datos
  const familiesHook = useFamilies();
  const medicationsHook = useMedications();
  const { toast } = useToast();
  
  // 2. Estado local para UI
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isOpen, setIsOpen] = useState(false);

  // 3. Extracción segura de datos (Ajustado según tus errores de TS en la captura)
  // Usamos (hook as any).data porque el IDE detecta que es un UseQueryResult
  const families = (familiesHook as any)?.data || (familiesHook as any)?.families || [];
  const isLoadingFamilies = familiesHook?.isLoading;
  const createFamily = familiesHook?.createFamily; 
  const updateFamily = familiesHook?.updateFamily; 
  const deleteFamily = familiesHook?.deleteFamily; 

  const medications = (medicationsHook as any)?.data || (medicationsHook as any)?.medications || [];
  const isLoadingMeds = medicationsHook?.isLoading;

  // 4. Lógica de Filtrado y Ordenamiento
  const filteredAndSortedFamilies = useMemo(() => {
    let result = families.filter((f: any) => {
      const name = f?.name?.toLowerCase() || "";
      const desc = f?.description?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || desc.includes(search);
    });

    return [...result].sort((a: any, b: any) => {
      if (sortBy === "az") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "za") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "most_used") {
        const countA = medications.filter((m: any) => m.familyId === a.id).length;
        const countB = medications.filter((m: any) => m.familyId === b.id).length;
        return countB - countA;
      }
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [families, searchTerm, sortBy, medications]);

  // 5. Manejador de creación
  const handleCreateFamily = async (data: any) => {
    const isDuplicate = families.some(
      (f: any) => f.name?.toLowerCase() === data.name?.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "Familia duplicada",
        description: `El grupo "${data.name}" ya está registrado.`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (createFamily?.mutateAsync) {
        await createFamily.mutateAsync(data);
        setIsOpen(false);
        toast({ title: "¡Éxito!", description: "Familia creada correctamente." });
      }
    } catch (e) {
      toast({ 
        title: "Error", 
        description: "No se pudo guardar la familia.", 
        variant: "destructive" 
      });
    }
  };

  // 5.1 Manejador de Edición
  const handleUpdateFamily = async (id: number, data: any) => {
    try {
      if (updateFamily?.mutateAsync) {
        await updateFamily.mutateAsync({ id, ...data });
        toast({ title: "Actualizado", description: "Cambios guardados." });
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  // 5.2 Manejador de Eliminación
  const handleDeleteFamily = async (id: number) => {
    const hasMedications = medications.some((m: any) => m.familyId === id);
    if (hasMedications) {
      toast({
        title: "No se puede eliminar",
        description: "Esta familia tiene medicamentos asociados.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm("¿Estás seguro de eliminar este grupo terapéutico?")) {
      try {
        if (deleteFamily?.mutateAsync) {
          await deleteFamily.mutateAsync(id);
          toast({ title: "Eliminado", description: "Familia eliminada con éxito." });
        }
      } catch (e) {
        toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
      }
    }
  };

  // 6. Pantalla de carga
  if (isLoadingFamilies || isLoadingMeds) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        <p className="text-slate-400 mt-4 font-medium">Sincronizando inventario...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1a2b4b]">Familias Farmacológicas</h1>
          <p className="text-slate-500">Gestiona las categorías y grupos terapéuticos del inventario.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg">
              <Plus className="mr-2 h-5 w-5" /> Nueva Familia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Familia</DialogTitle>
            </DialogHeader>
            <FamilyForm 
              onSubmit={handleCreateFamily} 
              isLoading={createFamily?.isPending || false} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nombre o descripción..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-56">
            <SortAsc className="mr-2 h-4 w-4 text-primary" />
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más recientes</SelectItem>
            <SelectItem value="az">Nombre (A - Z)</SelectItem>
            <SelectItem value="za">Nombre (Z - A)</SelectItem>
            <SelectItem value="most_used">Mayor frecuencia de uso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedFamilies.map((family: any) => (
          <FamilyCard 
            key={family.id} 
            family={family} 
            onDelete={() => handleDeleteFamily(family.id)} 
            onUpdate={(data: any) => handleUpdateFamily(family.id, data)}
          />
        ))}
      </div>

      {filteredAndSortedFamilies.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
          <p className="text-slate-500 mt-2 font-medium">No se encontraron familias que coincidan.</p>
        </div>
      )}
    </div>
  );
}