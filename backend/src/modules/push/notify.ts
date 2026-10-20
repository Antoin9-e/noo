import webpush from "web-push";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";

export const pushEnabled = !!(env.vapidPublicKey && env.vapidPrivateKey);
if (pushEnabled) webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  // Même tag = la notification remplace la précédente au lieu de s'empiler
  tag: string;
}

const THROTTLE_MS = 10 * 60_000;
const lastSent = new Map<string, number>();

// Pas plus d'une notification par type et par personne toutes les 10 min
function throttled(userId: string, type: string) {
  const key = `${userId}:${type}`;
  const now = Date.now();
  if ((lastSent.get(key) ?? 0) > now - THROTTLE_MS) return true;
  lastSent.set(key, now);
  return false;
}

export async function notify(
  userIds: string[],
  type: string,
  payload: PushPayload,
  { throttle = true }: { throttle?: boolean } = {},
) {
  if (!pushEnabled || userIds.length === 0) return;
  const targets = throttle ? userIds.filter((id) => !throttled(id, type)) : userIds;
  if (!targets.length) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: targets } } });
  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 3600 },
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // Abonnement expiré ou révoqué : on l'oublie
        if (code === 404 || code === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        else console.error("push échoué", code ?? e);
      }
    }),
  );
}

// Fire-and-forget : une notification ne doit jamais faire échouer une requête
export function notifyLater(...args: Parameters<typeof notify>) {
  notify(...args).catch((e) => console.error("push", e));
}

export async function otherMembers(familyId: string, userId: string) {
  const members = await prisma.membership.findMany({ where: { familyId, userId: { not: userId } }, select: { userId: true } });
  return members.map((m) => m.userId);
}

export async function firstNameOf(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return user?.name.trim().split(/\s+/)[0] ?? "Quelqu'un";
}
