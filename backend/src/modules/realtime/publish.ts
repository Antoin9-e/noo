import type { Server } from "bun";

let server: Server<unknown> | null = null;

export function setRealtimeServer(s: Server<unknown> | null | undefined) {
  server = s ?? null;
}

export const familyTopic = (familyId: string) => `family:${familyId}`;

// Le serveur ne pousse pas de données, juste « ça a changé » : le client refetch.
// Les clés suivent celles de TanStack Query côté front : [ressource, familyId].
export function publish(familyId: string, resources: Array<"events" | "wishes" | "activity" | "family">) {
  if (!server) return;
  server.publish(
    familyTopic(familyId),
    JSON.stringify({ type: "invalidate", keys: resources.map((r) => [r, familyId]) }),
  );
}
