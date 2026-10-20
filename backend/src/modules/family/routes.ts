import { Elysia } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { requireMembership } from "../../plugins/family-guard.js";
import { prisma } from "../../lib/prisma.js";

export const memberSelect = {
  role: true,
  color: true,
  user: { select: { id: true, name: true, image: true } },
} as const;

export const familyRoutes = new Elysia({ prefix: "/api/families" })
  .use(authGuard)
  .get(
    "/:id",
    async ({ user, params }) => {
      await requireMembership(user.id, params.id);
      return prisma.family.findUniqueOrThrow({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          timezone: true,
          memberships: { select: memberSelect, orderBy: { createdAt: "asc" } },
        },
      });
    },
    { auth: true },
  );
