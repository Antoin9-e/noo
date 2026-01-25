import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedUsers() {
  const hashedPassword = await hashPassword("Password123");

  // Upsert Eric - crée ou met à jour s'il existe déjà
  const Eric = await prisma.user.upsert({
    where: { email: "eric@gmail.com" },
    update: {
      name: "Eric",
    },
    create: {
      name: "Eric",
      email: "eric@gmail.com",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: randomUUID(),
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  // Upsert Eline - crée ou met à jour s'il existe déjà
  const Eline = await prisma.user.upsert({
    where: { email: "eline@gmail.com" },
    update: {
      name: "Eline",
    },
    create: {
      name: "Eline",
      email: "eline@gmail.com",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: randomUUID(),
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  return { Eric, Eline };
}
