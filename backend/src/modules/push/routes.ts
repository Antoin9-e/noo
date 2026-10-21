import { Elysia, t } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";
import { notify, pushEnabled } from "./notify.js";

export const pushRoutes = new Elysia({ prefix: "/api/push" })
  .use(authGuard)
  .get("/public-key", () => ({ enabled: pushEnabled, publicKey: env.vapidPublicKey || null }), { auth: true })
  .post(
    "/subscribe",
    async ({ user, body }) => {
      // Un endpoint = un appareil ; s'il change de compte, il suit le nouveau
      await prisma.pushSubscription.upsert({
        where: { endpoint: body.endpoint },
        create: { userId: user.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
        update: { userId: user.id, p256dh: body.keys.p256dh, auth: body.keys.auth },
      });
      return { ok: true };
    },
    {
      auth: true,
      body: t.Object({
        endpoint: t.String({ maxLength: 1000 }),
        keys: t.Object({ p256dh: t.String({ maxLength: 200 }), auth: t.String({ maxLength: 100 }) }),
      }),
    },
  )
  .delete(
    "/subscribe",
    async ({ user, body }) => {
      await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint: body.endpoint } });
      return { ok: true };
    },
    { auth: true, body: t.Object({ endpoint: t.String() }) },
  )
  .post(
    "/test",
    async ({ user }) => {
      await notify([user.id], "test", { title: "Noo 💜🧡", body: "Les notifications fonctionnent !", url: "/", tag: "test" }, { throttle: false });
      return { ok: true };
    },
    { auth: true },
  );
