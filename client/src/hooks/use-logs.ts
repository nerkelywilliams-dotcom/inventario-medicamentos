import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogWithUser } from "@shared/schema";

// Definimos qué datos necesita la bitácora para crear un registro
type CreateLogInput = {
  action: string;
  details: string;
  userId: number;
};

// 1. Hook para LEER la bitácora (el que ya tenías)
export function useLogs() {
  return useQuery<LogWithUser[]>({
    queryKey: ["/api/logs"],
    // Se refresca cada 10 segundos para ver cambios casi en tiempo real
    refetchInterval: 10000, 
    retry: 1 
  });
}

// 2. Hook para ESCRIBIR en la bitácora (El nuevo que faltaba)
export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLog: CreateLogInput) => {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog),
      });

      if (!res.ok) {
        throw new Error("Error al registrar movimiento en la bitácora");
      }
      
      return res.json();
    },
    // Cuando termine de guardar, actualiza la lista automáticamente
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
  });
}