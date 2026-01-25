import { Elysia } from "elysia";
import { prisma } from "../lib/prisma.js";

export const familyRoutes = new Elysia({ prefix: "/api" })
  .get("/families", async () => {
    const families = await prisma.family.findMany();
    return { families };
  })
  .get("/families/:id", async ({ params }) => {
    const family = await prisma.family.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        responsibles: {
          select: { user: { select: { id: true, name: true, email: true } } },
        },
        members: {
          select: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    return { family };
  });
