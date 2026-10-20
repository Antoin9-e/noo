import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Family, Me } from "@/types";

export const meKey = ["me"] as const;

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => api<Me>("/me") });
}

export function useFamily(familyId: string | undefined) {
  return useQuery({
    queryKey: ["family", familyId],
    queryFn: () => api<Family>(`/families/${familyId}`),
    enabled: !!familyId,
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return api<{ url: string }>("/me/avatar", { method: "POST", body: form });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKey });
      qc.invalidateQueries({ queryKey: ["family"] });
    },
  });
}
