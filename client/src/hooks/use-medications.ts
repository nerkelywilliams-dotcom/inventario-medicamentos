"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// ✅ CORRECCIÓN: Separamos las rutas de los esquemas de datos
import { api, buildUrl } from "@shared/routes";
import { type InsertMedicationFull, type InsertMedication } from "@shared/schema"; 
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast"; // Agregado para feedback visual
import { z } from "zod";

function encodeUserHeader(user: any): string {
  return btoa(JSON.stringify(user));
}

export function useMedications(params?: { search?: string; familyId?: string }) {
  const { user } = useAuth();
  const queryKey = [api.medications.list.path, params?.search, params?.familyId, user?.id];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.medications.list.path, window.location.origin);
      if (params?.search) url.searchParams.append("search", params.search);
      if (params?.familyId) url.searchParams.append("familyId", params.familyId);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }

      const res = await fetch(url.toString(), { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch medications");
      return api.medications.list.responses[200].parse(await res.json());
    },
    enabled: !!user, // Solo cargar si hay usuario
  });
}

export function useMedication(id: number) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [api.medications.get.path, id, user?.id],
    queryFn: async () => {
      const url = buildUrl(api.medications.get.path, { id });
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }
      
      const res = await fetch(url, { headers, credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch medication");
      return api.medications.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !!user,
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertMedicationFull) => {
      const payload = {
        ...data,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }

      const res = await fetch(api.medications.create.path, {
        method: api.medications.create.method,
        headers,
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create medication");
      }
      return api.medications.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medications.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({ title: "¡Éxito!", description: "Medicamento registrado correctamente." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

/**
 * ✅ NUEVO: Hook para Importación Masiva
 * Procesa un arreglo de medicamentos y los envía al backend.
 */
export function useBulkCreateMedications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (medications: any[]) => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }

      // Normalización de datos antes de enviar (Crucial para Excel/CSV)
      const payload = medications.map(m => ({
        ...m,
        expirationDate: m.expirationDate ? new Date(m.expirationDate) : null,
        quantity: isNaN(Number(m.quantity)) ? 0 : Number(m.quantity),
        isPediatric: String(m.isPediatric).toUpperCase() === 'TRUE' || m.isPediatric === 'Sí' || m.isPediatric === true,
        familyId: m.familyId ? Number(m.familyId) : null
      }));

      const res = await fetch("/api/medications/import", { 
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("text/html")) {
          throw new Error("Error de ruta (404/500). Verifica que /api/medications/import exista.");
        }
        const error = await res.json();
        throw new Error(error.message || "Error en la carga masiva");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medications.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({ title: "Importación completada", description: "El inventario ha sido actualizado." });
    },
    onError: (error: Error) => {
      toast({ title: "Error en importación", description: error.message, variant: "destructive" });
    }
  });
}

/**
 * ✅ NUEVO: Hook para Borrar Inventario
 */
export function useClearInventory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }

      const res = await fetch("/api/medications", {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("No se pudo limpiar el inventario: Error de ruta (404/500).");
        }
        const error = await res.json();
        throw new Error(error.message || "No se pudo limpiar el inventario");
      }
    },
    onSuccess: () => {
      // Forzamos el refresco de todas las listas relacionadas
      queryClient.invalidateQueries({ queryKey: [api.medications.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({ title: "Inventario vaciado", description: "Se han eliminado todos los registros." });
    },
    onError: (error: Error) => {
      toast({ title: "Error al vaciar", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertMedication>) => {
      const url = buildUrl(api.medications.update.path, { id });
      
      const payload = { ...updates };
      if (payload.expirationDate) {
        payload.expirationDate = new Date(payload.expirationDate);
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }

      const res = await fetch(url, {
        method: api.medications.update.method,
        headers,
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update medication");
      return api.medications.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medications.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.medications.get.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({ title: "Actualizado", description: "Medicamento modificado con éxito." });
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.medications.delete.path, { id });
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }
      
      const res = await fetch(url, { 
        method: api.medications.delete.method,
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete medication");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medications.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({ title: "Eliminado", description: "Medicamento removido del inventario." });
    },
  });
}
