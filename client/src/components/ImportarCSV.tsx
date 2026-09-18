"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useBulkCreateMedications } from "@/hooks/use-medications";
import { useCreateLog } from "@/hooks/use-logs";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSpreadsheet } from "lucide-react";

export function ImportarCSV() {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkCreateMutation = useBulkCreateMedications();
  const createLog = useCreateLog();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          toast({
            variant: "destructive",
            title: "Archivo vacío",
            description: "No se encontraron datos en el archivo seleccionado.",
          });
          setIsProcessing(false);
          return;
        }

        const formattedData = rawData.map((row) => {
          const isPediatricRaw = row["isPediatric"] ?? row["Es Pediátrico"] ?? row["Pediátrico"];
          const isPediatric = 
            isPediatricRaw === true || 
            String(isPediatricRaw).toUpperCase() === "TRUE" || 
            String(isPediatricRaw).toUpperCase() === "VERDADERO" ||
            String(isPediatricRaw) === "1";

          let expDate = row["expirationDate"] ?? row["expiration Date"] ?? row["Fecha Vencimiento"] ?? row["Vencimiento"];
          if (expDate instanceof Date) {
            expDate = expDate.toISOString();
          }

          return {
            name: String(row["name"] ?? row["Nombre"] ?? row["Medicamento"] ?? "").trim(),
            dose: String(row["dose"] ?? row["Dosis"] ?? "Ver empaque").trim(),
            presentation: String(row["presentation"] ?? row["Presentación"] ?? "No especificada").trim(),
            quantity: Number(row["quantity"] ?? row["Cantidad"] ?? row["Stock"] ?? 0),
            expirationDate: expDate,
            isPediatric: isPediatric,
            familyId: row["familyId"] ?? row["Familia ID"] ? Number(row["familyId"] ?? row["Familia ID"]) : null,
            description: row["description"] ?? row["Descripción"] ?? null,
            mechanismOfAction: row["actionMechanism"] ?? row["mechanismOfAction"] ?? row["Mecanismo de Acción"] ?? null,
            indications: row["indications"] ?? row["Indicaciones"] ?? null,
            posology: row["posology"] ?? row["Posología"] ?? null,
            administrationRoute: row["administrationRoute"] ?? row["Vía de Administración"] ?? row["Vía"] ?? null,
            contraindications: row["contraindications"] ?? row["Contraindicaciones"] ?? "No especificadas",
            interactions: row["interactions"] ?? row["Interacciones"] ?? "No especificadas",
          };
        }).filter(item => item.name.length > 0);

        if (formattedData.length === 0) {
          toast({
            variant: "destructive",
            title: "Formato no reconocido",
            description: "Asegúrate de incluir la columna 'name' o 'Nombre'.",
          });
          setIsProcessing(false);
          return;
        }

        await bulkCreateMutation.mutateAsync(formattedData);

        if (user) {
          await createLog.mutateAsync({
            action: "CREAR",
            details: `Carga masiva por Excel: ${formattedData.length} medicamentos cargados.`,
            userId: user.id,
          });
        }

        toast({
          title: "Carga Masiva Completada",
          description: `Se procesaron e ingresaron ${formattedData.length} medicamentos con éxito.`,
        });

      } catch (error: any) {
        console.error("Error al importar Excel:", error);
        toast({
          variant: "destructive",
          title: "Error al importar",
          description: error?.message || "Ocurrió un error al procesar la estructura del Excel.",
        });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={handleButtonClick}
        disabled={isProcessing || bulkCreateMutation.isPending}
        className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/50 font-medium shadow-sm"
      >
        {isProcessing || bulkCreateMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            Cargando Excel...
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Cargar desde Excel
          </>
        )}
      </Button>
    </>
  );
}
