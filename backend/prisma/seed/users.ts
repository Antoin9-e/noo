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

  const Emmanuelle = await prisma.user.upsert({
    where: { email: "emmanuelle@gmail.com" },
    update: {
      name: "Emmanuelle",
    },
    create: {
      name: "Emmanuelle",
      email: "emmanuelle@gmail.com",
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

  const John = await prisma.user.upsert({
    where: { email: "john@gmail.com" },
    update: {
      name: "John",
    },
    create: {
      name: "John",
      email: "john@gmail.com",
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

  const Marie = await prisma.user.upsert({
    where: { email: "marie@gmail.com" },
    update: {
      name: "Marie",
    },
    create: {
      name: "Marie",
      email: "marie@gmail.com",
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

  const Mathilde = await prisma.user.upsert({
    where: { email: "mathilde@gmail.com" },
    update: {
      name: "Mathilde",
    },
    create: {
      name: "Mathilde",
      email: "mathilde@gmail.com",
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

  const Christophe = await prisma.user.upsert({
    where: { email: "christophe@gmail.com" },
    update: {
      name: "Christophe",
    },
    create: {
      name: "Christophe",
      email: "christophe@gmail.com",
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

  const Peggy = await prisma.user.upsert({
    where: { email: "peggy@gmail.com" },
    update: {
      name: "Peggy",
    },
    create: {
      name: "Peggy",
      email: "peggy@gmail.com",
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

  const Laurie = await prisma.user.upsert({
    where: { email: "laurie@gmail.com" },
    update: {
      name: "Laurie",
    },
    create: {
      name: "Laurie",
      email: "laurie@gmail.com",
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

  return {
    Eric,
    Eline,
    Emmanuelle,
    John,
    Marie,
    Mathilde,
    Christophe,
    Peggy,
    Laurie,
  };
}
