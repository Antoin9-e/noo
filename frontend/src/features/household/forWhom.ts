export type ForWhom = "me" | "partner" | "both";

export function participantsFor(forWhom: ForWhom, meId: string, partnerId?: string) {
  if (forWhom === "me" || !partnerId) return [meId];
  if (forWhom === "partner") return [partnerId];
  return [meId, partnerId];
}

export function forWhomOf(participantIds: string[], meId: string, partnerId?: string): ForWhom {
  if (!partnerId) return "me";
  const hasMe = participantIds.includes(meId);
  const hasPartner = participantIds.includes(partnerId);
  if (hasMe && hasPartner) return "both";
  return hasPartner ? "partner" : "me";
}
