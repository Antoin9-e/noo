import type { Tone } from "@/components/common/Avatar";
import type { Member, PersonColor } from "@/types";

export function toneOf(color: PersonColor | undefined): Tone {
  if (color === "VIOLET") return "violet";
  if (color === "ORANGE") return "orange";
  return "none";
}

// 1 personne → sa couleur ; tout le foyer → dégradé ; personne → neutre
export function toneFor(userIds: string[], members: Member[]): Tone {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return "none";
  if (members.length > 1 && members.every((m) => unique.includes(m.user.id))) return "both";
  if (unique.length === 1) return toneOf(members.find((m) => m.user.id === unique[0])?.color);
  return "both";
}

export const TONE_BG: Record<Tone, string> = {
  violet: "bg-violet",
  orange: "bg-orange",
  both: "bg-gradient-noo",
  none: "bg-ink-3",
};

export const TONE_SOFT: Record<Tone, string> = {
  violet: "bg-violet-soft",
  orange: "bg-orange-soft",
  both: "bg-gradient-noo-soft",
  none: "bg-surface-2",
};

export const TONE_TEXT: Record<Tone, string> = {
  violet: "text-violet",
  orange: "text-orange",
  both: "text-gradient-noo",
  none: "text-ink-3",
};
