import { useState } from "react";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function ImportarCSV() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast({ title: "Procesando", description: "Importando medicamentos desde CSV..." });

    // Simulación de carga (Aquí conectarías con tu endpoint de backend si existe)
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setUploading(false);
      toast({ title: "¡Éxito!", description: "Medicamentos importados correctamente." });
    }, 1500);
  };

  return (
    <div className="flex gap-2">
      <input
        type="file"
        id="csvInput"
        className="hidden"
        accept=".csv"
        onChange={handleFileUpload}
      />
      <Button 
        variant="outline" 
        onClick={() => document.getElementById('csvInput')?.click()} 
        disabled={uploading}
        className="border-dashed"
      >
        <Upload className="mr-2 h-4 w-4" /> Importar CSV
      </Button>
    </div>
  );
}