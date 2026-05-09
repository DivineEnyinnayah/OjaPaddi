import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { env } from "@ojapaddi/env/native";

const API_URL = `${env.EXPO_PUBLIC_SERVER_URL}/api/customers`;

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const json = await authClient.$fetch(API_URL);
      return (json as any).data;
    },
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const json = await authClient.$fetch(`${API_URL}/${id}`);
      return (json as any).data;
    },
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
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
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
