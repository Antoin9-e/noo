import { Elysia, t } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { prisma } from "../../lib/prisma.js";
import { uploadImage } from "../../lib/cloudinary.js";
import { fileTypeFromBlob } from "file-type";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

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
    ({ user, body }) =>
      prisma.user.update({
        where: { id: user.id },
        data: { name: body.name.trim() },
        select: meSelect,
      }),
    { auth: true, body: t.Object({ name: t.String({ minLength: 1, maxLength: 60 }) }) },
  )
  .post(
    "/avatar",
    async ({ user, body, status }) => {
      // Vérifie le vrai contenu du fichier, pas le type annoncé par le navigateur.
      // (Le `type` de t.File dépend d'un import dynamique de file-type, absent du bundle Vercel.)
      const detected = await fileTypeFromBlob(body.image);
      if (!detected || !IMAGE_TYPES.includes(detected.mime)) {
        return status(422, { error: "Choisis une image JPEG, PNG ou WebP." });
      }
      try {
        const buffer = Buffer.from(await body.image.arrayBuffer());
        // L'identité vient de la session, jamais du body
        const { secure_url } = await uploadImage(buffer, user.id);
        await prisma.user.update({ where: { id: user.id }, data: { image: secure_url } });
        return { url: secure_url };
      } catch (e) {
        console.error("upload avatar", e);
        return status(500, { error: "Échec de l'upload" });
      }
    },
    {
      auth: true,
      body: t.Object({
        // Vercel refuse les corps de plus de 4,5 Mo : le front redimensionne avant l'envoi
        image: t.File({ maxSize: 4 * 1024 * 1024 }),
      }),
    },
  );
