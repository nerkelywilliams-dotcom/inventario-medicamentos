import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import type { User, InsertUser } from "@shared/schema";

function encodeUserHeader(user: any): string {
  const userJson = JSON.stringify(user);
  if (typeof btoa !== 'undefined') {
    return btoa(userJson);
  } else {
    return Buffer.from(userJson).toString('base64');
  }
}

export function useUsers() {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['/api/users', currentUser?.id],
    queryFn: async () => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (currentUser) {
        headers['x-user'] = encodeUserHeader(currentUser);
      }
      
      const res = await fetch('/api/users', { 
        headers, 
        credentials: "include" 
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json() as Promise<User[]>;
    },
    enabled: !!currentUser,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (currentUser) {
        headers['x-user'] = encodeUserHeader(currentUser);
      }
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create user');
      }
      
      return res.json() as Promise<User>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (currentUser) {
        headers['x-user'] = encodeUserHeader(currentUser);
      }
      
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error('Failed to delete user');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
}
