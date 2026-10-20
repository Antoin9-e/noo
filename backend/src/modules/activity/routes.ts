import { Elysia, t } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { requireMembership } from "../../plugins/family-guard.js";
import { prisma } from "../../lib/prisma.js";
import { publish } from "../realtime/publish.js";

const EMOJIS = ["❤️", "😂", "🔥", "👍", "😍", "🥹", "🤤", "🎉"];

export const activityRoutes = new Elysia({ prefix: "/api/families/:familyId/activity" })
  .use(authGuard)
  .get(
    "/",
    async ({ user, params, query }) => {
      await requireMembership(user.id, params.familyId);
      return prisma.activity.findMany({
        where: { familyId: params.familyId },
        orderBy: { createdAt: "desc" },
        take: query.limit ?? 20,
        select: {
          id: true,
          actorId: true,
          type: true,
          payload: true,
          createdAt: true,
          reactions: { select: { userId: true, emoji: true } },
        },
      });
    },
    { auth: true, query: t.Object({ limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })) }) },
  )
  .put(
    "/:activityId/reaction",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const activity = await prisma.activity.findFirst({ where: { id: params.activityId, familyId: params.familyId } });
      if (!activity) return status(404, { error: "Introuvable" });
      await prisma.activityReaction.upsert({
        where: { activityId_userId: { activityId: activity.id, userId: user.id } },
        create: { activityId: activity.id, userId: user.id, emoji: body.emoji },
        update: { emoji: body.emoji },
      });
      publish(params.familyId, ["activity"]);
      return { ok: true };
    },
    { auth: true, body: t.Object({ emoji: t.Union(EMOJIS.map((e) => t.Literal(e))) }) },
  )
  .delete(
    "/:activityId/reaction",
    async ({ user, params }) => {
      await requireMembership(user.id, params.familyId);
      await prisma.activityReaction.deleteMany({
        where: { activityId: params.activityId, userId: user.id, activity: { familyId: params.familyId } },
      });
      publish(params.familyId, ["activity"]);
      return { ok: true };
    },
    { auth: true },
  );
