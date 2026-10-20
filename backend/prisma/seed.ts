import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { auth } from "../src/lib/auth.js";

const FAMILY_ID = "00000000-0000-0000-0000-000000000001";
const PASSWORD = "password123";

async function upsertUser(name: string, email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const { user } = await auth.api.signUpEmail({ body: { name, email, password: PASSWORD } });
  return user;
}

async function main() {
  console.log("🌱 Seed…");
  const toi = await upsertUser("Antoine", "toi@noo.dev");
  const elle = await upsertUser("Léa", "elle@noo.dev");

  await prisma.family.upsert({
    where: { id: FAMILY_ID },
    update: {},
    create: {
      id: FAMILY_ID,
      name: "Chez nous",
      memberships: {
        create: [
          { userId: toi.id, role: "ADMIN", color: "VIOLET" },
          { userId: elle.id, role: "MEMBER", color: "ORANGE" },
        ],
      },
    },
  });

  console.log(`✅ Comptes : toi@noo.dev / elle@noo.dev (mot de passe : ${PASSWORD})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
