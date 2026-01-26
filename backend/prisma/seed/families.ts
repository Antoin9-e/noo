import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedFamilies(
  ericId: string,
  elineId: string,
  johnId: string,
  marieId: string,
  mathildeId: string,
  emmanuelleId: string,
  christopheId: string,
  peggyId: string,
  laurieId: string,
) {
  // ID fixe pour le seed (toujours le même)
  const matterFamilyId = "00000000-0000-0000-0000-000000000001";
  const ruffinFamilyId = "00000000-0000-0000-0000-000000000002";
  const godefroyFamilyId = "00000000-0000-0000-0000-000000000003";

  const Matter = await prisma.family.upsert({
    where: { id: matterFamilyId },
    update: {
      name: "Matter",
    },
    create: {
      id: matterFamilyId,
      name: "Matter",
      responsibles: {
        create: {
          userId: ericId,
        },
      },
      members: {
        createMany: {
          data: [{ userId: ericId }, { userId: elineId }],
        },
      },
    },
  });

  const Ruffin = await prisma.family.upsert({
    where: { id: ruffinFamilyId },
    update: {
      name: "Ruffin",
    },
    create: {
      id: ruffinFamilyId,
      name: "Ruffin",
      responsibles: {
        create: {
          userId: johnId,
        },
      },
      members: {
        createMany: {
          data: [
            { userId: johnId },
            { userId: marieId },
            { userId: mathildeId },
            { userId: emmanuelleId },
            { userId: elineId },
          ],
        },
      },
    },
  });

  const Godefroy = await prisma.family.upsert({
    where: { id: godefroyFamilyId },
    update: {
      name: "Godefroy",
    },
    create: {
      id: godefroyFamilyId,
      name: "Godefroy",
      responsibles: {
        create: {
          userId: christopheId,
        },
      },
      members: {
        createMany: {
          data: [
            { userId: peggyId },
            { userId: laurieId },
            { userId: christopheId },
          ],
        },
      },
    },
  });

  return { Matter, Ruffin, Godefroy };
}
