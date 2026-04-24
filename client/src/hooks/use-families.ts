import { useQuery, useMutation } from "@tanstack/react-query";
import { type Family, type InsertFamily } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook unificado para la gestión de familias farmacológicas
 */
export function useFamilies() {
  const { user } = useAuth();

  // Helper interno para peticiones autenticadas y evitar repetición de código
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        "x-user": user ? btoa(JSON.stringify(user)) : "",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error en la petición: ${res.statusText}`);
    }
    return res.status !== 204 ? res.json() : null;
  };

  // 1. Consulta de datos (Obtener todas las familias)
  const query = useQuery<Family[]>({
    queryKey: ["/api/families"],
    queryFn: () => apiRequest("/api/families"),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos de caché para evitar peticiones redundantes
  });

  // 2. Mutación para crear
  const createFamily = useMutation({
    mutationFn: (data: InsertFamily) => 
      apiRequest("/api/families", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
  });

  // 3. Mutación para actualizar (Editar)
  const updateFamily = useMutation({
    mutationFn: ({ id, ...data }: Partial<InsertFamily> & { id: number }) =>
      apiRequest(`/api/families/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      // ✅ Agregado: Actualizar inventario si el nombre de la familia cambia
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
    },
  });

  // 4. Mutación para eliminar
  const deleteFamily = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/families/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      // ✅ Agregado: Actualizar inventario si se elimina una familia
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
    },
  });

  // Retornamos todo en un solo objeto
  return {
    data: query.data ?? [], // Alias para 'families' para mayor consistencia con useQuery
    families: query.data ?? [], // Mantenemos el nombre original
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createFamily,
    updateFamily,
    deleteFamily
  };
}

/**
 * EXPORTS INDIVIDUALES
 * Nota: Estos hooks llaman a useFamilies(). Si se usan varios en un mismo componente,
 * lo ideal es usar useFamilies() directamente para evitar múltiples instancias de la query.
 */
export function useCreateFamily() { return useFamilies().createFamily; }
export function useUpdateFamily() { return useFamilies().updateFamily; }
export function useDeleteFamily() { return useFamilies().deleteFamily; }
