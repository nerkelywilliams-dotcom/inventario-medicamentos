import { useQuery } from "@tanstack/react-query";
import { LogWithUser } from "@shared/schema";

export function useLogs() {
  return useQuery<LogWithUser[]>({
    queryKey: ["/api/logs"],
    // Se refresca cada 10 segundos para que veas los cambios casi en tiempo real
    refetchInterval: 10000, 
    // Esto asegura que solo intente buscar si hay una sesión activa
    retry: 1 
  });
}