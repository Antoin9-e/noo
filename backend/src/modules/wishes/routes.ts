import { Elysia, t } from "elysia";
import type { Prisma, WishCategory } from "@prisma/client";
import { authGuard } from "../../plugins/auth-guard.js";
import { requireMembership } from "../../plugins/family-guard.js";
import { prisma } from "../../lib/prisma.js";
import { recordActivity } from "../activity/record.js";

const CATEGORIES = ["MOVIE", "SERIES", "RESTAURANT", "OUTING", "TRIP", "GIFT", "OTHER"] as const;
const categorySchema = t.Union(CATEGORIES.map((c) => t.Literal(c)));

const wishInclude = { votes: { select: { userId: true, vote: true, rating: true } } } as const;
type WishRow = Prisma.WishGetPayload<{ include: typeof wishInclude }>;

// Un cadeau n'est jamais visible par son destinataire
function visibleTo(userId: string): Prisma.WishWhereInput {
  return { NOT: { category: "GIFT", forUserId: userId } };
}

function serialize(wish: WishRow, userId: string, memberIds: string[]) {
  const { votes, ...rest } = wish;
  const yesBy = votes.filter((v) => v.vote === "YES").map((v) => v.userId);
  return {
    ...rest,
    votes,
    yesBy,
    myVote: votes.find((v) => v.userId === userId)?.vote ?? null,
    isMatch: isMatch(wish.category, yesBy, memberIds),
  };
}

// Match = tout le foyer (au moins 2) a dit oui ; jamais pour un cadeau
function isMatch(category: WishCategory, yesBy: string[], memberIds: string[]) {
  return category !== "GIFT" && memberIds.length > 1 && memberIds.every((id) => yesBy.includes(id));
}

async function memberIdsOf(familyId: string) {
  const members = await prisma.membership.findMany({ where: { familyId }, select: { userId: true } });
  return members.map((m) => m.userId);
}

async function findVisibleWish(familyId: string, wishId: string, userId: string) {
  return prisma.wish.findFirst({
    where: { id: wishId, familyId, ...visibleTo(userId) },
    include: wishInclude,
  });
}

const optionalText = (max: number) => t.Optional(t.Nullable(t.String({ maxLength: max })));
const clean = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() || null);

export const wishRoutes = new Elysia({ prefix: "/api/families/:familyId/wishes" })
  .use(authGuard)
  .get(
    "/",
    async ({ user, params, query }) => {
      await requireMembership(user.id, params.familyId);
      const [wishes, memberIds] = await Promise.all([
        prisma.wish.findMany({
          where: {
            familyId: params.familyId,
            category: query.category,
            status: query.status,
            ...visibleTo(user.id),
          },
          include: wishInclude,
          orderBy: { createdAt: "desc" },
        }),
        memberIdsOf(params.familyId),
      ]);
      return wishes.map((w) => serialize(w, user.id, memberIds));
    },
    {
      auth: true,
      query: t.Object({
        category: t.Optional(categorySchema),
        status: t.Optional(t.Union([t.Literal("OPEN"), t.Literal("DONE")])),
      }),
    },
  )
  // Pour le mode Match : envies ouvertes de l'autre que je n'ai pas encore swipées
  .get(
    "/to-swipe",
    async ({ user, params, query }) => {
      await requireMembership(user.id, params.familyId);
      const [wishes, memberIds] = await Promise.all([
        prisma.wish.findMany({
          where: {
            familyId: params.familyId,
            status: "OPEN",
            category: query.category,
            NOT: { category: "GIFT" },
            votes: { none: { userId: user.id, vote: { not: null } } },
          },
          include: wishInclude,
          orderBy: { createdAt: "asc" },
          take: 50,
        }),
        memberIdsOf(params.familyId),
      ]);
      return wishes.map((w) => serialize(w, user.id, memberIds));
    },
    { auth: true, query: t.Object({ category: t.Optional(categorySchema) }) },
  )
  .post(
    "/",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const memberIds = await memberIdsOf(params.familyId);
      const isGift = body.category === "GIFT";
      if (isGift && body.forUserId && !memberIds.includes(body.forUserId)) {
        return status(400, { error: "Destinataire inconnu" });
      }
      if (isGift && body.forUserId === user.id) return status(400, { error: "Pas de cadeau pour soi-même 😉" });

      const wish = await prisma.$transaction(async (tx) => {
        const wish = await tx.wish.create({
          data: {
            familyId: params.familyId,
            createdById: user.id,
            category: body.category,
            title: body.title.trim(),
            note: clean(body.note),
            url: clean(body.url),
            imageUrl: clean(body.imageUrl),
            externalId: clean(body.externalId),
            year: body.year ?? null,
            forUserId: isGift ? (body.forUserId ?? null) : null,
            // Le créateur dit oui d'office (pas de vote pour un cadeau)
            votes: isGift ? undefined : { create: { userId: user.id, vote: "YES" } },
          },
          include: wishInclude,
        });
        // Un cadeau reste secret : pas d'entrée dans le fil
        if (!isGift) {
          await recordActivity(tx, {
            familyId: params.familyId,
            actorId: user.id,
            type: "wish.added",
            payload: { wishId: wish.id, title: wish.title, category: wish.category, imageUrl: wish.imageUrl },
          });
        }
        return wish;
      });
      return serialize(wish, user.id, memberIds);
    },
    {
      auth: true,
      body: t.Object({
        category: categorySchema,
        title: t.String({ minLength: 1, maxLength: 160 }),
        note: optionalText(2000),
        url: optionalText(1000),
        imageUrl: optionalText(1000),
        externalId: optionalText(100),
        year: t.Optional(t.Nullable(t.Integer({ minimum: 1800, maximum: 2200 }))),
        forUserId: optionalText(100),
      }),
    },
  )
  .patch(
    "/:wishId",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const existing = await findVisibleWish(params.familyId, params.wishId, user.id);
      if (!existing) return status(404, { error: "Envie introuvable" });
      const memberIds = await memberIdsOf(params.familyId);
      const becomesDone = body.status === "DONE" && existing.status !== "DONE";

      const wish = await prisma.$transaction(async (tx) => {
        const wish = await tx.wish.update({
          where: { id: existing.id },
          data: {
            title: body.title?.trim(),
            note: clean(body.note),
            url: clean(body.url),
            status: body.status,
            doneAt: body.status === undefined ? undefined : body.status === "DONE" ? new Date() : null,
          },
          include: wishInclude,
        });
        if (becomesDone && wish.category !== "GIFT") {
          await recordActivity(tx, {
            familyId: params.familyId,
            actorId: user.id,
            type: "wish.done",
            payload: { wishId: wish.id, title: wish.title, category: wish.category, imageUrl: wish.imageUrl },
          });
        }
        return wish;
      });
      return serialize(wish, user.id, memberIds);
    },
    {
      auth: true,
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 160 })),
        note: optionalText(2000),
        url: optionalText(1000),
        status: t.Optional(t.Union([t.Literal("OPEN"), t.Literal("DONE")])),
      }),
    },
  )
  .delete(
    "/:wishId",
    async ({ user, params, status }) => {
      await requireMembership(user.id, params.familyId);
      const existing = await findVisibleWish(params.familyId, params.wishId, user.id);
      if (!existing) return status(404, { error: "Envie introuvable" });
      await prisma.wish.delete({ where: { id: existing.id } });
      return { ok: true };
    },
    { auth: true },
  )
  .put(
    "/:wishId/vote",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const existing = await findVisibleWish(params.familyId, params.wishId, user.id);
      if (!existing) return status(404, { error: "Envie introuvable" });
      if (existing.category === "GIFT") return status(400, { error: "On ne vote pas pour un cadeau" });
      const memberIds = await memberIdsOf(params.familyId);
      const wasMatch = isMatch(
        existing.category,
        existing.votes.filter((v) => v.vote === "YES").map((v) => v.userId),
        memberIds,
      );

      const wish = await prisma.$transaction(async (tx) => {
        await tx.wishVote.upsert({
          where: { wishId_userId: { wishId: existing.id, userId: user.id } },
          create: { wishId: existing.id, userId: user.id, vote: body.vote },
          update: { vote: body.vote },
        });
        const wish = await tx.wish.findUniqueOrThrow({ where: { id: existing.id }, include: wishInclude });
        const yesBy = wish.votes.filter((v) => v.vote === "YES").map((v) => v.userId);
        if (!wasMatch && isMatch(wish.category, yesBy, memberIds)) {
          await recordActivity(tx, {
            familyId: params.familyId,
            actorId: user.id,
            type: "wish.matched",
            payload: { wishId: wish.id, title: wish.title, category: wish.category, imageUrl: wish.imageUrl },
          });
        }
        return wish;
      });
      const result = serialize(wish, user.id, memberIds);
      return { ...result, justMatched: !wasMatch && result.isMatch };
    },
    { auth: true, body: t.Object({ vote: t.Union([t.Literal("YES"), t.Literal("NO")]) }) },
  )
  .put(
    "/:wishId/rating",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const existing = await findVisibleWish(params.familyId, params.wishId, user.id);
      if (!existing) return status(404, { error: "Envie introuvable" });
      await prisma.wishVote.upsert({
        where: { wishId_userId: { wishId: existing.id, userId: user.id } },
        create: { wishId: existing.id, userId: user.id, rating: body.rating },
        update: { rating: body.rating },
      });
      const wish = await prisma.wish.findUniqueOrThrow({ where: { id: existing.id }, include: wishInclude });
      return serialize(wish, user.id, await memberIdsOf(params.familyId));
    },
    { auth: true, body: t.Object({ rating: t.Integer({ minimum: 1, maximum: 5 }) }) },
  );
