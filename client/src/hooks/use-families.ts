import { useQuery, useMutation } from "@tanstack/react-query";
import { type Family, type InsertFamily } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
/**
 * Hook para obtener todas las familias farmacéuticas
 */
export function useFamilies() {
  const { user } = useAuth(); // 2. Obtenemos al usuario logueado

  return useQuery<Family[]>({
    queryKey: ["/api/families"],
    // Solo se ejecuta si hay un usuario, para evitar errores
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
      // 3. Pasamos el encabezado de autorización manual
      const res = await fetch("/api/families", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": btoa(JSON.stringify(user)), // Codificamos el usuario para el portero del servidor
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