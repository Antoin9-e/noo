import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyService } from "@/services/family.service";
import type { newFam } from "@/types";
import { toast } from "sonner";

export function useFamily(id: string | undefined) {
  return useQuery({
    queryKey: ["family", id],
    queryFn: () => familyService.getFamily(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newfam: newFam) => familyService.createFamily(newfam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      toast.success("Family created with success!");
    },
    onError: () => {
      toast.error("Something wrong happen..");
    },
  });
}
