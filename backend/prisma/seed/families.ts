import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedFamilies(ericId: string, elineId: string) {
  // ID fixe pour le seed (toujours le même)
  const matterFamilyId = "00000000-0000-0000-0000-000000000001";

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

  return { Matter };
}
