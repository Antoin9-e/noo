import { useUi } from "@/stores/ui";
import { tap } from "@/lib/haptics";
import type { Vote, Wish } from "@/types";
import { useVote } from "./hooks";

// Vote + vibration ; si ce vote crée un match, célébration plein écran
export function useVoteWithCelebration() {
  const vote = useVote();
  const celebrate = useUi((s) => s.celebrate);
  return (wish: Wish, v: Vote) => {
    tap(v === "YES" ? 12 : 6);
    vote.mutate(
      { id: wish.id, vote: v },
      { onSuccess: (res) => res.justMatched && celebrate(res) },
    );
  };
}
