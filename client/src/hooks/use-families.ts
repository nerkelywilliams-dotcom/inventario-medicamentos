import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertFamily } from "@shared/routes";
import { useAuth } from "@/context/AuthContext";

function encodeUserHeader(user: any): string {
  return btoa(JSON.stringify(user));
}

export function useFamilies() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [api.families.list.path, user?.id],
    queryFn: async () => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }
      
      const res = await fetch(api.families.list.path, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch families");
      return api.families.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: InsertFamily) => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        headers["x-user"] = encodeUserHeader(user);
      }
      
      const res = await fetch(api.families.create.path, {
        method: api.families.create.method,
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create family");
      return api.families.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.families.list.path] });
    },
  });
}
