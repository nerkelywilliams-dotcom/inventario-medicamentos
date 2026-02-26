import { useQuery, useMutation } from "@tanstack/react-query";
import { type Family, type InsertFamily } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook unificado para la gestión de familias farmacológicas
 */
export function useFamilies() {
  const { user } = useAuth();

  // 1. Consulta de datos (Obtener todas las familias)
  const query = useQuery<Family[]>({
    queryKey: ["/api/families"],
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
    enabled: !!user, 
  });

  // 2. Mutación para crear
  const createFamily = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
  });

  // 3. Mutación para actualizar (Editar)
  const updateFamily = useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertFamily> & { id: number }) => {
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

  // 4. Mutación para eliminar
  const deleteFamily = useMutation({
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

  // Retornamos todo en un solo objeto para que la página lo consuma fácilmente
  return {
    families: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createFamily,
    updateFamily,
    deleteFamily
  };
}

// Mantengo estos exports individuales por si otros componentes los usan por separado
export function useCreateFamily() { return useFamilies().createFamily; }
export function useUpdateFamily() { return useFamilies().updateFamily; }
export function useDeleteFamily() { return useFamilies().deleteFamily; }