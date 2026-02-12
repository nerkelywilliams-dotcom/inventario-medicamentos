import { useQuery, useMutation } from "@tanstack/react-query";
import { type Family, type InsertFamily } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

/**
 * Hook para obtener todas las familias farmacéuticas
 */
export function useFamilies() {
  return useQuery<Family[]>({
    queryKey: ["/api/families"],
  });
}

/**
 * Hook para crear una nueva familia
 */
export function useCreateFamily() {
  return useMutation({
    mutationFn: async (data: InsertFamily) => {
      const res = await apiRequest("POST", "/api/families", data);
      return res.json();
    },
    onSuccess: () => {
      // Refresca la lista automáticamente en la UI
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
  });
}

/**
 * Hook para actualizar una familia existente
 */
export function useUpdateFamily() {
  return useMutation({
    mutationFn: async ({ id, ...data }: InsertFamily & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/families/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
  });
}

/**
 * Hook para eliminar una familia
 */
export function useDeleteFamily() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/families/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
  });
}