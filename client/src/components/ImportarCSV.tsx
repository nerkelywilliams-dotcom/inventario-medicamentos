import { useState } from "react";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBulkCreateMedications } from "@/hooks/use-medications"; // ✅ Importamos el nuevo hook
import * as XLSX from "xlsx";

export function ImportarCSV() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const { mutateAsync: bulkCreate } = useBulkCreateMedications(); // ✅ Usamos la mutación

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
            name: row.name ? String(row.name).trim() : (row.Nombre || ""),
            presentation: row.presentation ? String(row.presentation).trim() : (row.Presentación || ""),
            quantity: parseInt(row.quantity || row.Cantidad) || 0,
            expirationDate: row.expirationDate || row["Fecha de Vencimiento"] || row.Vencimiento || null,
            dose: row.dose || row.Dosis || "Ver empaque",
            description: row.description || row.Descripción || row["Descripción General"] || row["Descripcion General"] || "",
            mechanismOfAction: row.mechanismOfAction || row["Mecanismo de Acción"] || "",
            indications: row.indications || row.Indicaciones || "",
            posology: row.posology || row.Posología || "",
            administrationRoute: row.administrationRoute || row["Vía de Administración"] || "",
            contraindications: row.contraindications || row.Contraindicaciones || "No especificadas",
            interactions: row.interactions || row.Interacciones || "No especificadas",
            isPediatric: row.isPediatric || row.Pediátrico || false,
            familyId: row.familyId ? parseInt(row.familyId) : undefined,
          })).filter(item => item.name && item.presentation); // Ignorar filas vacías

          if (formattedData.length === 0) {
            throw new Error("El archivo está vacío o las columnas no coinciden con 'name' y 'presentation'.");
          }

          toast({ title: "Importando", description: `Enviando ${formattedData.length} medicamentos...` });
          
          // ✅ ENVIAR DATOS USANDO EL HOOK (Maneja auth y caché automáticamente)
          await bulkCreate(formattedData);

          toast({ 
            title: "¡Éxito!", 
            description: `${formattedData.length} medicamentos importados correctamente.` 
          });
          
        } catch (error: any) {
          console.error("Error detallado:", error);
          toast({ 
            variant: "destructive", 
            title: "Error en la importación", 
            description: error.message || "Hubo un problema al procesar los datos." 
          });
        } finally {
          setUploading(false);
          event.target.value = ''; // Resetear el input
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "No se pudo leer el archivo." 
      });
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
