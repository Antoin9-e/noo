import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type ActivityType =
  | "event.added"
  | "event.updated"
  | "wish.added"
  | "wish.matched"
  | "wish.done";

// À appeler dans la même transaction que la mutation qui produit l'activité
export function recordActivity(
  tx: Tx,
  data: { familyId: string; actorId: string; type: ActivityType; payload: Prisma.InputJsonObject },
) {
  return tx.activity.create({ data });
}
