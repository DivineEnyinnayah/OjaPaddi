import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { env } from "@ojapaddi/env/native";

const API_URL = `${env.EXPO_PUBLIC_SERVER_URL}/api/products`;

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const json = await authClient.$fetch(API_URL);
      return (json as any).data;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const json = await authClient.$fetch(`${API_URL}/${id}`);
      return (json as any).data;
    },
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const json = await authClient.$fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
