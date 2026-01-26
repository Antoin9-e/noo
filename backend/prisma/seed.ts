import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { seedUsers } from "./seed/users";
import { seedFamilies } from "./seed/families";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");
  const {
    Eric,
    Eline,
    John,
    Marie,
    Mathilde,
    Emmanuelle,
    Christophe,
    Peggy,
    Laurie,
  } = await seedUsers();
  await seedFamilies(
    Eric.id,
    Eline.id,
    John.id,
    Marie.id,
    Mathilde.id,
    Emmanuelle.id,
    Christophe.id,
    Peggy.id,
    Laurie.id,
  );

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
