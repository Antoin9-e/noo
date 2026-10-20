import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { env } from "./env.js";

const pool = new Pool({ connectionString: env.databaseUrl });
// Sur Vercel (Fluid compute) : ferme les connexions inactives avant la suspension de l'instance
attachDatabasePool(pool);

export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
