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

type SortOption = "az" | "za" | "most_used" | "newest";

export default function FamiliesPage() {
  const { families = [], createFamily, isLoading } = useFamilies();
  const { medications = [] } = useMedications();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isOpen, setIsOpen] = useState(false);

  // ✅ LÓGICA DE FILTRADO CON "OPTIONAL CHAINING" PARA EVITAR CRASHES
  const filteredAndSortedFamilies = useMemo(() => {
    if (!Array.isArray(families)) return [];

    let result = families.filter(f => {
      const name = f?.name?.toLowerCase() || "";
      const desc = f?.description?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || desc.includes(search);
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "az":
          return (a?.name || "").localeCompare(b?.name || "");
        case "za":
          return (b?.name || "").localeCompare(a?.name || "");
        case "newest":
          return (Number(b?.id) || 0) - (Number(a?.id) || 0);
        case "most_used":
          const countA = medications?.filter(m => m.familyId === a.id).length || 0;
          const countB = medications?.filter(m => m.familyId === b.id).length || 0;
          return countB - countA;
        default:
          return 0;
      }
    });
  }, [families, searchTerm, sortBy, medications]);

  const handleCreateFamily = async (data: any) => {
    const nameNormalized = data.name?.trim().toLowerCase();
    const alreadyExists = families?.some(
      (f) => f.name?.trim().toLowerCase() === nameNormalized
    );

    if (alreadyExists) {
      toast({
        title: "Familia ya registrada",
        description: `"${data.name}" ya existe.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await createFamily.mutateAsync(data);
      setIsOpen(false);
      toast({ title: "¡Éxito!", description: "Familia creada correctamente." });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo crear.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        <p className="text-slate-400 mt-4">Cargando grupos terapéuticos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1a2b4b]">Familias Farmacológicas</h1>
          <p className="text-slate-500">Gestión de categorías del inventario.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg"><Plus className="mr-2 h-5 w-5" /> Nueva Familia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Grupo</DialogTitle></DialogHeader>
            <FamilyForm onSubmit={handleCreateFamily} isLoading={createFamily.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar familia..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
          <SelectTrigger className="w-full md:w-56">
            <SortAsc className="mr-2 h-4 w-4 text-primary" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Recientes</SelectItem>
            <SelectItem value="az">A-Z</SelectItem>
            <SelectItem value="za">Z-A</SelectItem>
            <SelectItem value="most_used">Más utilizados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedFamilies.map((family) => (
          <FamilyCard key={family.id} family={family} />
        ))}
      </div>

      {filteredAndSortedFamilies.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
          <p className="text-slate-500 mt-2">No se encontraron resultados.</p>
        </div>
      )}
    </div>
  );
}