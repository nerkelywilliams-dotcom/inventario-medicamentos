import { useQuery, useMutation } from "@tanstack/react-query";
import { type Family, type InsertFamily } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook para obtener todas las familias farmacéuticas
 */
export function useFamilies() {
  const { user } = useAuth();

  return useQuery<Family[]>({
    queryKey: ["/api/families"],
    // Agregamos queryFn para enviar el header de autorización al visualizar
    queryFn: async () => {
      const res = await fetch("/api/families", {
        headers: {
          "x-user": btoa(JSON.stringify(user)),
        },
      });
      if (!res.ok) {
        throw new Error("Error al obtener las familias");
      }
      return res.json();
    },
    // Solo se ejecuta si hay un usuario logueado
    enabled: !!user, 
  });
}

/**
 * Hook para crear una nueva familia
 */
export function useCreateFamily() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: InsertFamily) => {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": btoa(JSON.stringify(user)),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear la familia");
      }
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: InsertFamily & { id: number }) => {
      const res = await fetch(`/api/families/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user": btoa(JSON.stringify(user)),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al actualizar");
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/families/${id}`, {
        method: "DELETE",
        headers: {
          "x-user": btoa(JSON.stringify(user)),
        },
      });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
  });
}