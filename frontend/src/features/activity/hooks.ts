import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveFamilyId, useMe } from "@/features/household/hooks";
import type { Activity } from "@/types";

export const REACTIONS = ["❤️", "😂", "🔥", "👍", "😍", "🥹", "🤤", "🎉"] as const;

export function useActivity() {
  const familyId = useActiveFamilyId();
  return useQuery({
    queryKey: ["activity", familyId],
    queryFn: () => api<Activity[]>(`/families/${familyId}/activity?limit=30`),
    enabled: !!familyId,
  });
}

// Optimiste : le cœur s'allume au moment du tap
export function useReact() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  const { data: me } = useMe();
  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string | null }) =>
      emoji
        ? api(`/families/${familyId}/activity/${id}/reaction`, { method: "PUT", body: { emoji } })
        : api(`/families/${familyId}/activity/${id}/reaction`, { method: "DELETE" }),
    onMutate: async ({ id, emoji }) => {
      await qc.cancelQueries({ queryKey: ["activity", familyId] });
      const previous = qc.getQueryData<Activity[]>(["activity", familyId]);
      qc.setQueryData<Activity[]>(["activity", familyId], (list) =>
        list?.map((a) => {
          if (a.id !== id || !me) return a;
          const others = a.reactions.filter((r) => r.userId !== me.id);
          return { ...a, reactions: emoji ? [...others, { userId: me.id, emoji }] : others };
        }),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["activity", familyId], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ["activity", familyId] }),
  });
}
