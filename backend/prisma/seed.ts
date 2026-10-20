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

  await seedDemo(toi.id, elle.id);

  console.log(`✅ Comptes : toi@noo.dev / elle@noo.dev (mot de passe : ${PASSWORD})`);
}

// Données de démo, seulement si le foyer est vide
async function seedDemo(toiId: string, elleId: string) {
  if (await prisma.wish.count({ where: { familyId: FAMILY_ID } })) return;

  const wishes: Array<{
    category: "MOVIE" | "SERIES" | "RESTAURANT" | "OUTING" | "TRIP" | "GIFT" | "OTHER";
    title: string;
    by: string;
    yes?: string[];
    year?: number;
    note?: string;
    forUserId?: string;
  }> = [
    { category: "MOVIE", title: "Dune : Deuxième partie", year: 2024, by: toiId, yes: [elleId] },
    { category: "MOVIE", title: "Amélie Poulain", year: 2001, by: elleId, yes: [toiId] },
    { category: "MOVIE", title: "Past Lives", year: 2023, by: elleId },
    { category: "MOVIE", title: "Interstellar", year: 2014, by: elleId },
    { category: "SERIES", title: "The Bear", year: 2022, by: toiId, yes: [elleId] },
    { category: "SERIES", title: "Lupin", year: 2021, by: elleId },
    { category: "RESTAURANT", title: "Le petit italien de la rue Oberkampf", by: elleId, yes: [toiId], note: "Les pâtes à la truffe !" },
    { category: "RESTAURANT", title: "Ramen Kodawari", by: toiId },
    { category: "RESTAURANT", title: "Brunch chez Mamie", by: elleId },
    { category: "OUTING", title: "Expo Van Gogh", by: elleId, yes: [toiId] },
    { category: "OUTING", title: "Escape game", by: toiId },
    { category: "TRIP", title: "Lisbonne", by: toiId, yes: [elleId] },
    { category: "TRIP", title: "Week-end à Étretat", by: elleId },
    { category: "GIFT", title: "Le parfum qu'elle a senti au Printemps", by: toiId, forUserId: elleId },
    { category: "OTHER", title: "Cours de cuisine à deux", by: elleId },
  ];

  for (const w of wishes) {
    await prisma.wish.create({
      data: {
        familyId: FAMILY_ID,
        createdById: w.by,
        category: w.category,
        title: w.title,
        year: w.year,
        note: w.note,
        forUserId: w.forUserId,
        votes:
          w.category === "GIFT"
            ? undefined
            : { create: [w.by, ...(w.yes ?? [])].map((userId) => ({ userId, vote: "YES" as const })) },
      },
    });
  }

  const at = (days: number, hour: number, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  const events = [
    { title: "Dîner chez Paul & Marie", startAt: at(2, 20), people: [toiId, elleId] },
    { title: "Yoga", startAt: at(1, 8, 30), endAt: at(1, 9, 30), people: [elleId] },
    { title: "Foot avec les potes", startAt: at(3, 19), people: [toiId] },
    { title: "Lisbonne ✈️", startAt: at(24, 0), allDay: true, isCountdown: true, people: [toiId, elleId] },
  ];
  for (const e of events) {
    await prisma.event.create({
      data: {
        familyId: FAMILY_ID,
        createdById: toiId,
        title: e.title,
        startAt: e.startAt,
        endAt: e.endAt,
        allDay: e.allDay ?? false,
        isCountdown: e.isCountdown ?? false,
        participants: { create: e.people.map((userId) => ({ userId })) },
      },
    });
  }

  await prisma.activity.createMany({
    data: [
      { familyId: FAMILY_ID, actorId: elleId, type: "wish.added", payload: { title: "Past Lives", category: "MOVIE" } },
      { familyId: FAMILY_ID, actorId: elleId, type: "wish.matched", payload: { title: "Expo Van Gogh", category: "OUTING" } },
    ],
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
