import { Elysia } from "elysia";
import { prisma } from "../lib/prisma.js";

export const userRoutes = new Elysia({ prefix: "/api" })
  .get("/users", async () => {
    const users = await prisma.user.findMany();
    return { users };
  })
  .get("/users/:id", async ({ params }) => {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        responsibleFor: {
          select: { family: { select: { id: true, name: true } } },
        },
        memberships: {
          select: { family: { select: { id: true, name: true } } },
        },
      },
    });
    return { user };
  });
