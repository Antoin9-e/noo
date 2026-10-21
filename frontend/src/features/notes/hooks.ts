import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveFamilyId, useMe } from "@/features/household/hooks";
import type { Note, SpotifyItem } from "@/types";

// Même reconnaissance que le serveur ; les liens courts (spotify.link) sont résolus côté serveur
export const SPOTIFY_LINK = /open\.spotify\.com\/|spotify:[a-z]+:|spotify(\.app)?\.link\//;

export function spotifyUrlIn(text: string) {
  return text.match(/https?:\/\/\S+/g)?.find((u) => SPOTIFY_LINK.test(u)) ?? (SPOTIFY_LINK.test(text) ? text.trim() : null);
}

export const openInSpotify = (type: string, id: string) => `https://open.spotify.com/${type}/${id}`;

export function useNotes() {
  const familyId = useActiveFamilyId();
  return useQuery({
    queryKey: ["notes", familyId],
    queryFn: () => api<Note[]>(`/families/${familyId}/notes`),
    enabled: !!familyId,
  });
}

// Mots de l'autre pas encore vus
export function useUnreadNotes() {
  const { data: me } = useMe();
  const { data } = useNotes();
  return (data ?? []).filter((n) => n.authorId !== me?.id && !n.readAt);
}

export function useSpotifyPreview(url: string) {
  const familyId = useActiveFamilyId();
  return useQuery({
    queryKey: ["spotify", url],
    queryFn: () => api<SpotifyItem>(`/families/${familyId}/notes/spotify?url=${encodeURIComponent(url)}`),
    enabled: !!familyId && SPOTIFY_LINK.test(url),
    staleTime: Infinity,
    retry: false,
  });
}

export function useSendNote() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  return useMutation({
    mutationFn: (body: { text: string | null; spotifyUrl: string | null; notify: boolean }) =>
      api<Note>(`/families/${familyId}/notes`, { method: "POST", body }),
    onSuccess: (note) => qc.setQueryData<Note[]>(["notes", familyId], (list) => [note, ...(list ?? [])]),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notes", familyId] }),
  });
}

export function useMarkNotesRead() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  return useMutation({
    mutationFn: () => api(`/families/${familyId}/notes/read`, { method: "POST" }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notes", familyId] }),
  });
}

// Optimiste : le mot disparaît tout de suite
export function useDeleteNote() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  return useMutation({
    mutationFn: (id: string) => api(`/families/${familyId}/notes/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notes", familyId] });
      const previous = qc.getQueryData<Note[]>(["notes", familyId]);
      qc.setQueryData<Note[]>(["notes", familyId], (list) => list?.filter((n) => n.id !== id));
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["notes", familyId], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notes", familyId] }),
  });
}

export function useReactNote() {
  const qc = useQueryClient();
  const familyId = useActiveFamilyId();
  const { data: me } = useMe();
  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string | null }) =>
      emoji
        ? api(`/families/${familyId}/notes/${id}/reaction`, { method: "PUT", body: { emoji } })
        : api(`/families/${familyId}/notes/${id}/reaction`, { method: "DELETE" }),
    onMutate: async ({ id, emoji }) => {
      await qc.cancelQueries({ queryKey: ["notes", familyId] });
      const previous = qc.getQueryData<Note[]>(["notes", familyId]);
      qc.setQueryData<Note[]>(["notes", familyId], (list) =>
        list?.map((n) => {
          if (n.id !== id || !me) return n;
          const others = n.reactions.filter((r) => r.userId !== me.id);
          return { ...n, reactions: emoji ? [...others, { userId: me.id, emoji }] : others };
        }),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["notes", familyId], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notes", familyId] }),
  });
}
