import type { Wish } from "@/types";

// Envies de l'autre que je n'ai pas encore swipées
export const toSwipe = (wishes: Wish[]) =>
  wishes.filter((w) => w.status === "OPEN" && w.category !== "GIFT" && w.myVote === null && !w.id.startsWith("temp-"));

export const openMatches = (wishes: Wish[]) => wishes.filter((w) => w.status === "OPEN" && w.isMatch);
