import { status } from "elysia";
import { prisma } from "../lib/prisma.js";

// Lève une 403 si l'utilisateur n'est pas membre du foyer
export async function requireMembership(userId: string, familyId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  });
  if (!membership) throw status(403, { error: "Accès refusé à ce foyer" });
  return membership;
}
