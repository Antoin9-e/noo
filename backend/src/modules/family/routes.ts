import { Elysia, t } from "elysia";
import { randomBytes } from "node:crypto";
import { authGuard } from "../../plugins/auth-guard.js";
import { requireMembership } from "../../plugins/family-guard.js";
import { prisma } from "../../lib/prisma.js";

export const memberSelect = {
  role: true,
  color: true,
  user: { select: { id: true, name: true, image: true } },
} as const;

const familySelect = {
  id: true,
  name: true,
  timezone: true,
  memberships: { select: memberSelect, orderBy: { createdAt: "asc" as const } },
};

const COLORS = ["VIOLET", "ORANGE"] as const;
const INVITATION_DAYS = 7;

const colorSchema = t.Union([t.Literal("VIOLET"), t.Literal("ORANGE")]);

export const familyRoutes = new Elysia({ prefix: "/api" })
  .use(authGuard)
  .post(
    "/families",
    ({ user, body }) =>
      prisma.family.create({
        data: {
          name: body.name.trim(),
          memberships: { create: { userId: user.id, role: "ADMIN", color: body.color } },
        },
        select: familySelect,
      }),
    {
      auth: true,
      body: t.Object({ name: t.String({ minLength: 1, maxLength: 40 }), color: colorSchema }),
    },
  )
  .get(
    "/families/:familyId",
    async ({ user, params }) => {
      await requireMembership(user.id, params.familyId);
      return prisma.family.findUniqueOrThrow({ where: { id: params.familyId }, select: familySelect });
    },
    { auth: true },
  )
  .patch(
    "/families/:familyId",
    async ({ user, params, body, status }) => {
      const membership = await requireMembership(user.id, params.familyId);
      if (membership.role !== "ADMIN") return status(403, { error: "Réservé à l'admin du foyer" });
      return prisma.family.update({
        where: { id: params.familyId },
        data: { name: body.name.trim() },
        select: familySelect,
      });
    },
    { auth: true, body: t.Object({ name: t.String({ minLength: 1, maxLength: 40 }) }) },
  )
  .patch(
    "/families/:familyId/me",
    async ({ user, params, body }) => {
      const mine = await requireMembership(user.id, params.familyId);
      if (mine.color !== body.color) {
        // Couleur prise par l'autre : on échange. L'unicité (familyId, color) interdit
        // un simple double update, donc on retire puis recrée la ligne de l'autre.
        await prisma.$transaction(async (tx) => {
          const other = await tx.membership.findUnique({
            where: { familyId_color: { familyId: params.familyId, color: body.color } },
          });
          if (other) {
            await tx.membership.delete({
              where: { userId_familyId: { userId: other.userId, familyId: params.familyId } },
            });
          }
          await tx.membership.update({
            where: { userId_familyId: { userId: user.id, familyId: params.familyId } },
            data: { color: body.color },
          });
          if (other) await tx.membership.create({ data: { ...other, color: mine.color } });
        });
      }
      return prisma.family.findUniqueOrThrow({ where: { id: params.familyId }, select: familySelect });
    },
    { auth: true, body: t.Object({ color: colorSchema }) },
  )
  .post(
    "/families/:familyId/invitations",
    async ({ user, params }) => {
      await requireMembership(user.id, params.familyId);
      const now = new Date();
      // Un seul lien valide à la fois : les précédents expirent
      await prisma.invitation.updateMany({
        where: { familyId: params.familyId, usedAt: null, expiresAt: { gt: now } },
        data: { expiresAt: now },
      });
      const invitation = await prisma.invitation.create({
        data: {
          familyId: params.familyId,
          createdById: user.id,
          token: randomBytes(24).toString("base64url"),
          expiresAt: new Date(now.getTime() + INVITATION_DAYS * 24 * 3600 * 1000),
        },
      });
      return { token: invitation.token, expiresAt: invitation.expiresAt };
    },
    { auth: true },
  )
  // Public : de quoi afficher « Antoine t'invite à rejoindre Chez nous »
  .get("/invitations/:token", async ({ params, status }) => {
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
      include: { family: { select: { name: true } } },
    });
    if (!invitation) return status(404, { error: "Invitation introuvable" });
    const inviter = await prisma.membership.findUnique({
      where: { userId_familyId: { userId: invitation.createdById, familyId: invitation.familyId } },
      select: { color: true, user: { select: { name: true, image: true } } },
    });
    return {
      familyName: invitation.family.name,
      inviter: inviter && { ...inviter.user, color: inviter.color },
      valid: !invitation.usedAt && invitation.expiresAt > new Date(),
    };
  })
  .post(
    "/invitations/:token/accept",
    async ({ user, params, status }) => {
      const invitation = await prisma.invitation.findUnique({
        where: { token: params.token },
        include: { family: { include: { memberships: true } } },
      });
      if (!invitation) return status(404, { error: "Invitation introuvable" });

      const { family } = invitation;
      if (family.memberships.some((m) => m.userId === user.id)) {
        return { familyId: family.id, alreadyMember: true };
      }
      if (invitation.usedAt || invitation.expiresAt <= new Date()) {
        return status(410, { error: "Ce lien a expiré, demande-en un nouveau" });
      }
      const color = COLORS.find((c) => !family.memberships.some((m) => m.color === c));
      if (!color) return status(409, { error: "Ce foyer est déjà complet" });

      await prisma.$transaction([
        prisma.membership.create({ data: { userId: user.id, familyId: family.id, color } }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: { usedById: user.id, usedAt: new Date() },
        }),
      ]);
      return { familyId: family.id, alreadyMember: false };
    },
    { auth: true },
  );
