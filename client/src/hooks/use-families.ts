import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertFamily } from "@shared/routes";

export function useFamilies() {
  return useQuery({
    queryKey: [api.families.list.path],
    queryFn: async () => {
      const res = await fetch(api.families.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch families");
      return api.families.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFamily) => {
      const res = await fetch(api.families.create.path, {
        method: api.families.create.method,
        headers: { "Content-Type": "application/json" },
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
