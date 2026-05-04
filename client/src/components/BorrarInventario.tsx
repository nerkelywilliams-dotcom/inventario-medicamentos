import { useState } from "react";
import { Button } from "./ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Asegúrate de que no tenga errores de dedo

export function BorrarInventario() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClearAll = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) headers["x-user"] = btoa(JSON.stringify(user));

      const response = await fetch('/api/medications/all', {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error al vaciar el inventario' }));
        throw new Error(error.message || "Error al vaciar el inventario");
      }

      // Refrescar los datos de la tabla sin recargar la página
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      
      toast({
        title: "Inventario vaciado",
        description: "Se han eliminado todos los registros de esta sede.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Vaciar Inventario
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            ¿Estás absolutamente segura?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente todos 
            los medicamentos registrados en tu sede actual del sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleClearAll}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
          >
            {loading ? "Borrando..." : "Sí, borrar todo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
