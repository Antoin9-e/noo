import { Elysia, t } from "elysia";
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
  })
  .post(
    "/families/create",
    async ({ body }) => {
      const newFamily = await prisma.family.create({
        data: {
          name: body.name,
          responsibles: {
            create: {
              userId: body.userId,
            },
          },
          members: {
            create: {
              userId: body.userId,
            },
          },
        },
      });
      return { family: newFamily };
    },
    {
      body: t.Object({
        name: t.String(),
        userId: t.String(),
      }),
    },
  );
