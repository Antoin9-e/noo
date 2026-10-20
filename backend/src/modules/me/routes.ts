import { Elysia, t } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { prisma } from "../../lib/prisma.js";
import { uploadImage } from "../../lib/cloudinary.js";
import { publish } from "../realtime/publish.js";

// Nom et photo apparaissent chez l'autre : on prévient tous mes foyers
async function notifyFamilies(userId: string) {
  const memberships = await prisma.membership.findMany({ where: { userId }, select: { familyId: true } });
  for (const { familyId } of memberships) publish(familyId, ["family"]);
}

const meSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  memberships: {
    select: {
      role: true,
      color: true,
      family: { select: { id: true, name: true, timezone: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export const meRoutes = new Elysia({ prefix: "/api/me" })
  .use(authGuard)
  .get(
    "/",
    ({ user }) => prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: meSelect }),
    { auth: true },
  )
  .patch(
    "/",
    async ({ user, body }) => {
      const me = await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name.trim() },
        select: meSelect,
      });
      await notifyFamilies(user.id);
      return me;
    },
    { auth: true, body: t.Object({ name: t.String({ minLength: 1, maxLength: 60 }) }) },
  )
  .post(
    "/avatar",
    async ({ user, body, status }) => {
      try {
        const buffer = Buffer.from(await body.image.arrayBuffer());
        // L'identité vient de la session, jamais du body
        const { secure_url } = await uploadImage(buffer, user.id);
        await prisma.user.update({ where: { id: user.id }, data: { image: secure_url } });
        await notifyFamilies(user.id);
        return { url: secure_url };
      } catch {
        return status(500, { error: "Échec de l'upload" });
      }
    },
    {
      auth: true,
      body: t.Object({
        image: t.File({
          type: ["image/png", "image/jpeg", "image/webp"],
          maxSize: 5 * 1024 * 1024,
        }),
      }),
    },
  );
