import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMedication } from "@shared/routes";
import { useAuth } from "@/context/AuthContext";
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
      // Build URL with query params manually since buildUrl only handles path params
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
    enabled: !!id,
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: InsertMedication) => {
      // Ensure numeric fields are numbers, dates are Dates
      const payload = {
        ...data,
        expirationDate: new Date(data.expirationDate), // Ensure Date object
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
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create medication");
      }
      return api.medications.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medications.list.path] });
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertMedication>) => {
      const url = buildUrl(api.medications.update.path, { id });
      
      // Ensure date is properly formatted if present
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
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
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
    },
  });
}
