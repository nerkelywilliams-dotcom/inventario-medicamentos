import { useState } from "react";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import * as XLSX from "xlsx";

export function ImportarCSV() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast({ title: "Procesando", description: "Leyendo archivo..." });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir el Excel/CSV a un arreglo de objetos JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Mapear y limpiar los datos para asegurar que coincidan con tu schema de Zod
          const formattedData = jsonData.map((row: any) => ({
            name: row.name ? String(row.name).trim() : "",
            presentation: row.presentation ? String(row.presentation).trim() : "",
            quantity: parseInt(row.quantity) || 0,
            expirationDate: row.expirationDate ? new Date(row.expirationDate).toISOString() : new Date().toISOString(),
            dose: row.dose ? String(row.dose).trim() : "Ver empaque",
            description: row.description || "",
            mechanismOfAction: row.mechanismOfAction || "",
            indications: row.indications || "",
            posology: row.posology || "",
            administrationRoute: row.administrationRoute || "",
            contraindications: row.contraindications || "No especificadas",
            interactions: row.interactions || "No especificadas",
            isPediatric: row.isPediatric === "true" || row.isPediatric === true || row.isPediatric === 1,
            familyId: row.familyId ? parseInt(row.familyId) : undefined,
          })).filter(item => item.name && item.presentation); // Ignorar filas vacías

          if (formattedData.length === 0) {
            throw new Error("El archivo está vacío o las columnas no coinciden.");
          }

          toast({ title: "Importando", description: `Enviando ${formattedData.length} medicamentos...` });
          
          // Enviar los datos masivos al backend
          const response = await fetch('/api/medications/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formattedData)
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Error al guardar en la base de datos");
          }

          // Refrescar la tabla del inventario
          queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
          toast({ title: "¡Éxito!", description: `${formattedData.length} medicamentos importados correctamente.` });
          
        } catch (error: any) {
          toast({ variant: "destructive", title: "Error en el archivo", description: error.message });
        } finally {
          setUploading(false);
          event.target.value = ''; // Resetear el input para poder subir el mismo archivo de nuevo si falló
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo leer el archivo." });
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="file"
        id="csvInput"
        className="hidden"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={handleFileUpload}
      />
      <Button 
        variant="outline" 
        onClick={() => document.getElementById('csvInput')?.click()} 
        disabled={uploading}
        className="border-dashed"
      >
        <Upload className="mr-2 h-4 w-4" /> {uploading ? "Importando..." : "Importar Datos"}
      </Button>
    </div>
  );
}
