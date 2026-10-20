import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Pas de WebSocket sur Vercel : on refetch les données partagées régulièrement
// tant que l'app est visible, et tout de suite au retour au premier plan.
const SHARED = new Set(["events", "wishes", "activity", "family"]);
const INTERVAL = 15_000;

export function useRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const refresh = () =>
      qc.invalidateQueries({ predicate: (q) => SHARED.has(String(q.queryKey[0])) });

    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(refresh, INTERVAL);
    };
    // Téléphone verrouillé ou app en arrière-plan : on arrête de poller
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
        start();
      } else {
        window.clearInterval(timer);
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, qc]);
}
