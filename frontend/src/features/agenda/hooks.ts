import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useActiveFamilyId } from "@/features/household/hooks";
import type { NooEvent } from "@/types";

export type EventInput = Omit<NooEvent, "id" | "createdById">;

export function useEvents(from: Date, to: Date) {
  const familyId = useActiveFamilyId();
  return useQuery({
    queryKey: ["events", familyId, from.toISOString(), to.toISOString()],
    queryFn: () =>
      api<NooEvent[]>(
        `/families/${familyId}/events?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      ),
    enabled: !!familyId,
    placeholderData: (prev) => prev,
  });
}

export function useCountdowns() {
  const familyId = useActiveFamilyId();
  return useQuery({
    queryKey: ["events", familyId, "countdowns"],
    queryFn: () => api<NooEvent[]>(`/families/${familyId}/events/countdowns`),
    enabled: !!familyId,
  });
}

function overlaps(e: Pick<NooEvent, "startAt" | "endAt">, from: string, to: string) {
  const start = e.startAt;
  const end = e.endAt ?? e.startAt;
  return start < to && end >= from;
}

// Mise à jour optimiste : l'événement apparaît (ou change) tout de suite dans les vues chargées
export function useSaveEvent() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();

  return useMutation({
    mutationFn: ({ id, ...input }: Partial<EventInput> & { id?: string }) =>
      id
        ? api<NooEvent>(`/families/${familyId}/events/${id}`, { method: "PATCH", body: input })
        : api<NooEvent>(`/families/${familyId}/events`, { method: "POST", body: input }),
    onMutate: async ({ id, ...input }) => {
      await qc.cancelQueries({ queryKey: ["events", familyId] });
      const snapshot = qc.getQueriesData<NooEvent[]>({ queryKey: ["events", familyId] });
      const tempId = id ?? `temp-${Date.now()}`;
      for (const [key, list] of snapshot) {
        if (!list) continue;
        const [, , from, to] = key as [string, string, string, string?];
        const previous = list.find((e) => e.id === tempId);
        const next = { ...(previous ?? { id: tempId, createdById: "", note: null, location: null, endAt: null, allDay: false, isCountdown: false, participantIds: [] }), ...input } as NooEvent;
        const without = list.filter((e) => e.id !== tempId);
        const fits = to ? overlaps(next, from, to) : next.isCountdown;
        qc.setQueryData(key, fits ? [...without, next].sort((a, b) => a.startAt.localeCompare(b.startAt)) : without);
      }
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Impossible d'enregistrer, réessaie.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["events", familyId] });
      qc.invalidateQueries({ queryKey: ["activity", familyId] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  return useMutation({
    mutationFn: (id: string) => api(`/families/${familyId}/events/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["events", familyId] });
      const snapshot = qc.getQueriesData<NooEvent[]>({ queryKey: ["events", familyId] });
      qc.setQueriesData<NooEvent[]>({ queryKey: ["events", familyId] }, (list) => list?.filter((e) => e.id !== id));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Impossible de supprimer, réessaie.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["events", familyId] }),
  });
}
