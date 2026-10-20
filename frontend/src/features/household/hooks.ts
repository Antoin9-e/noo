import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { resizeImage } from "@/lib/resize-image";
import { useHouseholdStore } from "@/stores/household";
import type { Family, Me, PersonColor } from "@/types";

export const meKey = ["me"] as const;

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => api<Me>("/me") });
}

export function useFamily(familyId: string | null | undefined) {
  return useQuery({
    queryKey: ["family", familyId],
    queryFn: () => api<Family>(`/families/${familyId}`),
    enabled: !!familyId,
  });
}

// Foyer actif : celui mémorisé s'il existe encore, sinon le premier
export function useActiveFamilyId() {
  const { data: me } = useMe();
  const stored = useHouseholdStore((s) => s.activeFamilyId);
  if (!me) return stored;
  const ids = me.memberships.map((m) => m.family.id);
  return stored && ids.includes(stored) ? stored : (ids[0] ?? null);
}

// Tout ce qu'il faut pour afficher les couleurs : moi, l'autre, les membres
export function useHousehold() {
  const { data: me } = useMe();
  const familyId = useActiveFamilyId();
  const { data: family } = useFamily(familyId);
  const members = family?.memberships ?? [];
  const mine = members.find((m) => m.user.id === me?.id);
  const partner = members.find((m) => m.user.id !== me?.id);
  return { me, familyId, family, members, mine, partner, ready: !!me && !!family };
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("image", await resizeImage(file));
      return api<{ url: string }>("/me/avatar", { method: "POST", body: form });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKey });
      qc.invalidateQueries({ queryKey: ["family"] });
    },
  });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  const setActive = useHouseholdStore((s) => s.setActiveFamilyId);
  return useMutation({
    mutationFn: (body: { name: string; color: PersonColor }) =>
      api<Family>("/families", { method: "POST", body }),
    onSuccess: (family) => {
      setActive(family.id);
      qc.setQueryData(["family", family.id], family);
      return qc.invalidateQueries({ queryKey: meKey });
    },
  });
}

export function useUpdateFamily(familyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; color?: PersonColor }) =>
      body.color
        ? api<Family>(`/families/${familyId}/me`, { method: "PATCH", body: { color: body.color } })
        : api<Family>(`/families/${familyId}`, { method: "PATCH", body: { name: body.name } }),
    onSuccess: (family) => {
      qc.setQueryData(["family", family.id], family);
      return qc.invalidateQueries({ queryKey: meKey });
    },
  });
}

export function useCreateInvitation(familyId: string | null) {
  return useMutation({
    mutationFn: () =>
      api<{ token: string; expiresAt: string }>(`/families/${familyId}/invitations`, { method: "POST" }),
  });
}

export interface InvitationPreview {
  familyName: string;
  inviter: { name: string; image: string | null; color: PersonColor } | null;
  valid: boolean;
}

export function useInvitation(token: string | undefined) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: () => api<InvitationPreview>(`/invitations/${token}`),
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  const setActive = useHouseholdStore((s) => s.setActiveFamilyId);
  return useMutation({
    mutationFn: (token: string) =>
      api<{ familyId: string; alreadyMember: boolean }>(`/invitations/${token}/accept`, { method: "POST" }),
    onSuccess: ({ familyId }) => {
      setActive(familyId);
      return qc.invalidateQueries({ queryKey: meKey });
    },
  });
}
