import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

type Message = { type: "ready" } | { type: "invalidate"; keys: QueryKey[] };

// Le serveur dit « ça a changé », on refetch. Reconnexion avec backoff.
export function useRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let ws: WebSocket | null = null;
    let attempt = 0;
    let timer: number | undefined;
    let ping: number | undefined;
    let stopped = false;

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${location.host}/ws`);
      ws.onmessage = (e) => {
        if (e.data === "pong") return;
        const msg = JSON.parse(e.data) as Message;
        if (msg.type === "ready") {
          // Reconnexion : on a pu rater des changements
          if (attempt > 0) qc.invalidateQueries();
          attempt = 0;
        } else if (msg.type === "invalidate") {
          msg.keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
        }
      };
      ws.onopen = () => {
        ping = window.setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25_000);
      };
      ws.onclose = (e) => {
        window.clearInterval(ping);
        if (stopped || e.code === 4401) return;
        attempt++;
        timer = window.setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5)));
      };
    };

    // Au retour au premier plan (téléphone déverrouillé), on se reconnecte tout de suite
    const onVisible = () => {
      if (document.visibilityState === "visible" && ws?.readyState === WebSocket.CLOSED) {
        window.clearTimeout(timer);
        connect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(ping);
      document.removeEventListener("visibilitychange", onVisible);
      ws?.close();
    };
  }, [enabled, qc]);
}
