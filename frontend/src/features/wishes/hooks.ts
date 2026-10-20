import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useActiveFamilyId, useMe } from "@/features/household/hooks";
import type { MovieResult, Vote, Wish, WishCategory } from "@/types";

export function useWishes() {
  const familyId = useActiveFamilyId();
  return useQuery({
    queryKey: ["wishes", familyId],
    queryFn: () => api<Wish[]>(`/families/${familyId}/wishes`),
    enabled: !!familyId,
  });
}

export function useToSwipe() {
  const familyId = useActiveFamilyId();
  return useQuery({
    queryKey: ["wishes", familyId, "to-swipe"],
    queryFn: () => api<Wish[]>(`/families/${familyId}/wishes/to-swipe`),
    enabled: !!familyId,
  });
}

export type WishInput = {
  category: WishCategory;
  title: string;
  note?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  externalId?: string | null;
  year?: number | null;
  forUserId?: string | null;
};

function useInvalidate() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  return () => {
    qc.invalidateQueries({ queryKey: ["wishes", familyId] });
    qc.invalidateQueries({ queryKey: ["activity", familyId] });
  };
}

// Remplace (ou insère) une envie dans la liste en cache
function upsertIn(list: Wish[] | undefined, wish: Wish) {
  if (!list) return list;
  const found = list.some((w) => w.id === wish.id);
  return found ? list.map((w) => (w.id === wish.id ? wish : w)) : [wish, ...list];
}

export function useCreateWish() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  const { data: me } = useMe();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: WishInput) => api<Wish>(`/families/${familyId}/wishes`, { method: "POST", body: input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["wishes", familyId] });
      const previous = qc.getQueryData<Wish[]>(["wishes", familyId]);
      const temp: Wish = {
        id: `temp-${Date.now()}`,
        note: null, url: null, imageUrl: null, externalId: null, year: null, forUserId: null,
        ...input,
        status: "OPEN",
        doneAt: null,
        createdById: me?.id ?? "",
        createdAt: new Date().toISOString(),
        votes: [],
        yesBy: input.category === "GIFT" || !me ? [] : [me.id],
        myVote: input.category === "GIFT" ? null : "YES",
        isMatch: false,
      };
      qc.setQueryData<Wish[]>(["wishes", familyId], (list) => upsertIn(list, temp));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["wishes", familyId], ctx?.previous);
      toast.error("Impossible d'ajouter, réessaie.");
    },
    onSettled: invalidate,
  });
}

export function useUpdateWish() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; note?: string | null; url?: string | null; status?: "OPEN" | "DONE" }) =>
      api<Wish>(`/families/${familyId}/wishes/${id}`, { method: "PATCH", body }),
    onMutate: async ({ id, ...body }) => {
      await qc.cancelQueries({ queryKey: ["wishes", familyId] });
      const previous = qc.getQueryData<Wish[]>(["wishes", familyId]);
      qc.setQueryData<Wish[]>(["wishes", familyId], (list) =>
        list?.map((w) => (w.id === id ? { ...w, ...body, doneAt: body.status === "DONE" ? new Date().toISOString() : w.doneAt } : w)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["wishes", familyId], ctx?.previous);
      toast.error("Impossible d'enregistrer, réessaie.");
    },
    onSettled: invalidate,
  });
}

export function useDeleteWish() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api(`/families/${familyId}/wishes/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      const previous = qc.getQueryData<Wish[]>(["wishes", familyId]);
      qc.setQueryData<Wish[]>(["wishes", familyId], (list) => list?.filter((w) => w.id !== id));
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["wishes", familyId], ctx?.previous),
    onSettled: invalidate,
  });
}

export function useVote() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  const { data: me } = useMe();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, vote }: { id: string; vote: Vote }) =>
      api<Wish & { justMatched: boolean }>(`/families/${familyId}/wishes/${id}/vote`, { method: "PUT", body: { vote } }),
    onMutate: async ({ id, vote }) => {
      await qc.cancelQueries({ queryKey: ["wishes", familyId] });
      const previous = qc.getQueryData<Wish[]>(["wishes", familyId]);
      if (me) {
        qc.setQueryData<Wish[]>(["wishes", familyId], (list) =>
          list?.map((w) => {
            if (w.id !== id) return w;
            const yesBy = vote === "YES" ? [...new Set([...w.yesBy, me.id])] : w.yesBy.filter((u) => u !== me.id);
            return { ...w, myVote: vote, yesBy };
          }),
        );
      }
      return { previous };
    },
    onSuccess: (wish) => qc.setQueryData<Wish[]>(["wishes", familyId], (list) => upsertIn(list, wish)),
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["wishes", familyId], ctx?.previous);
      toast.error("Ton vote n'est pas passé, réessaie.");
    },
    onSettled: invalidate,
  });
}

export function useRate() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      api<Wish>(`/families/${familyId}/wishes/${id}/rating`, { method: "PUT", body: { rating } }),
    onSuccess: (wish) => qc.setQueryData<Wish[]>(["wishes", familyId], (list) => upsertIn(list, wish)),
  });
}

export function useMovieSearch(q: string) {
  return useQuery({
    queryKey: ["search", "movies", q],
    queryFn: () => api<MovieResult[]>(`/search/movies?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    staleTime: 5 * 60_000,
    retry: false,
    placeholderData: (prev) => prev,
  });
}

export function isSearchDisabled(error: unknown) {
  return error instanceof ApiError && error.status === 503;
}
