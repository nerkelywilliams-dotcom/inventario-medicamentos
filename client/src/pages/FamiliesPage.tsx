import { useState, useMemo } from "react";
import { useFamilies } from "@/hooks/use-families";
import { useMedications } from "@/hooks/use-medications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FamilyCard } from "@/components/FamilyCard";
import { FamilyForm } from "@/components/FamilyForm";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, SortAsc, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FamiliesPage() {
  const { families, createFamily, isLoading: loadingFamilies } = useFamilies();
  const { medications, isLoading: loadingMeds } = useMedications();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isOpen, setIsOpen] = useState(false);

  // 🛡️ Protección contra datos nulos o indefinidos
  const safeFamilies = Array.isArray(families) ? families : [];
  const safeMedications = Array.isArray(medications) ? medications : [];

  const filteredAndSortedFamilies = useMemo(() => {
    let result = safeFamilies.filter(f => {
      const name = f?.name?.toLowerCase() || "";
      const desc = f?.description?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || desc.includes(search);
    });

    return [...result].sort((a, b) => {
      if (sortBy === "az") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "za") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "most_used") {
        const countA = safeMedications.filter(m => m.familyId === a.id).length;
        const countB = safeMedications.filter(m => m.familyId === b.id).length;
        return countB - countA;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [safeFamilies, searchTerm, sortBy, safeMedications]);

  const handleCreateFamily = async (data: any) => {
    try {
      await createFamily.mutateAsync(data);
      setIsOpen(false);
      toast({ title: "Éxito", description: "Familia creada." });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo crear.", variant: "destructive" });
    }
  };

  // 🏥 Si está cargando, mostramos un spinner en lugar de pantalla blanca
  if (loadingFamilies || loadingMeds) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando MediStock...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a2b4b]">Familias Farmacológicas</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nueva Familia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Familia</DialogTitle></DialogHeader>
            <FamilyForm onSubmit={handleCreateFamily} isLoading={createFamily.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SortAsc className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más recientes</SelectItem>
            <SelectItem value="az">A - Z</SelectItem>
            <SelectItem value="za">Z - A</SelectItem>
            <SelectItem value="most_used">Más utilizados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredAndSortedFamilies.map((family) => (
          <FamilyCard key={family.id} family={family} />
        ))}
      </div>
    </div>
  );
}