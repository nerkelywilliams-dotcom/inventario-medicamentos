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
  SortDesc, 
  History, 
  BarChart3, 
  AlertCircle,
  Loader2
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

// Definimos las opciones de ordenamiento
type SortOption = "az" | "za" | "most_used" | "newest";

export default function FamiliesPage() {
  const { families, createFamily, isLoading } = useFamilies();
  const { medications } = useMedications();
  const { toast } = useToast();
  
  // Estados para búsqueda, orden y modal
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isOpen, setIsOpen] = useState(false);

  // ✅ LÓGICA DE FILTRADO Y ORDENAMIENTO (useMemo para rendimiento)
  const filteredAndSortedFamilies = useMemo(() => {
    if (!families) return [];

    // 1. Filtrar por el término de búsqueda
    let result = families.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 2. Aplicar el orden seleccionado
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "az":
          return a.name.localeCompare(b.name);
        case "za":
          return b.name.localeCompare(a.name);
        case "newest":
          return b.id - a.id; // Asumiendo que el ID más alto es el más reciente
        case "most_used":
          // Contamos cuántos medicamentos pertenecen a esta familia
          const countA = medications?.filter(m => m.familyId === a.id).length || 0;
          const countB = medications?.filter(m => m.familyId === b.id).length || 0;
          return countB - countA;
        default:
          return 0;
      }
    });
  }, [families, searchTerm, sortBy, medications]);

  // ✅ FUNCIÓN PARA CREAR CON VALIDACIÓN DE DUPLICADOS
  const handleCreateFamily = async (data: any) => {
    const nameNormalized = data.name.trim().toLowerCase();
    
    const alreadyExists = families?.some(
      (f) => f.name.trim().toLowerCase() === nameNormalized
    );

    if (alreadyExists) {
      toast({
        title: "Atención: Familia Duplicada",
        description: `La familia "${data.name}" ya existe en tu base de datos.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await createFamily.mutateAsync(data);
      setIsOpen(false);
      toast({
        title: "¡Éxito!",
        description: "Nueva familia farmacológica registrada.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la familia.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#1a2b4b]">
            Familias Farmacológicas
          </h1>
          <p className="text-slate-500 font-medium">
            Organiza el inventario por grupos terapéuticos.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
              <Plus className="mr-2 h-5 w-5" /> Nueva Familia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1a2b4b]">Registrar Familia</DialogTitle>
            </DialogHeader>
            <FamilyForm 
              onSubmit={handleCreateFamily} 
              isLoading={createFamily.isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ BARRA DE HERRAMIENTAS (Buscador + Sort) */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        <div className="w-full md:w-64">
          <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
            <SelectTrigger className="bg-slate-50 border-none">
              <div className="flex items-center gap-2 font-semibold text-slate-600">
                <SortAsc className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Ordenar por..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="font-medium">
                <div className="flex items-center gap-2"><History className="h-4 w-4" /> Recientes</div>
              </SelectItem>
              <SelectItem value="az" className="font-medium">
                <div className="flex items-center gap-2"><SortAsc className="h-4 w-4" /> Alfabético (A-Z)</div>
              </SelectItem>
              <SelectItem value="za" className="font-medium">
                <div className="flex items-center gap-2"><SortDesc className="h-4 w-4" /> Alfabético (Z-A)</div>
              </SelectItem>
              <SelectItem value="most_used" className="font-medium">
                <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Más utilizados</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LISTADO DE TARJETAS */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="mt-4 text-slate-400 font-medium">Cargando familias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedFamilies.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
          
          {filteredAndSortedFamilies.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="text-slate-500 font-bold text-lg">No encontramos resultados</p>
              <p className="text-slate-400 text-sm">Prueba con otro nombre o crea una familia nueva.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}