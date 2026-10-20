import { Elysia } from "elysia";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { familyTopic } from "./publish.js";

export const realtimeRoutes = new Elysia().ws("/ws", {
  async open(ws) {
    const session = await auth.api.getSession({ headers: ws.data.request.headers });
    if (!session) return ws.close(4401, "Non connecté");
    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      select: { familyId: true },
    });
    for (const { familyId } of memberships) ws.subscribe(familyTopic(familyId));
    ws.send(JSON.stringify({ type: "ready" }));
  },
  message(ws, message) {
    if (message === "ping") ws.send("pong");
  },
});
