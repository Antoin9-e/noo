import { Elysia, t } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { requireMembership } from "../../plugins/family-guard.js";
import { prisma } from "../../lib/prisma.js";
import { recordActivity } from "../activity/record.js";
import { publish } from "../realtime/publish.js";
import { firstNameOf, notifyLater } from "../push/notify.js";

export const eventSelect = {
  id: true,
  title: true,
  startAt: true,
  endAt: true,
  allDay: true,
  location: true,
  note: true,
  isCountdown: true,
  createdById: true,
  participants: { select: { userId: true } },
} as const;

type EventRow = {
  participants: { userId: string }[];
} & Record<string, unknown>;

function serialize<T extends EventRow>({ participants, ...event }: T) {
  return { ...event, participantIds: participants.map((p) => p.userId) };
}

const optionalText = (max: number) => t.Optional(t.Nullable(t.String({ maxLength: max })));

const eventBody = t.Object({
  title: t.String({ minLength: 1, maxLength: 120 }),
  startAt: t.String({ format: "date-time" }),
  endAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
  allDay: t.Optional(t.Boolean()),
  location: optionalText(200),
  note: optionalText(2000),
  isCountdown: t.Optional(t.Boolean()),
  participantIds: t.Optional(t.Array(t.String(), { minItems: 1 })),
});

// Les participants doivent appartenir au foyer ; par défaut, tout le monde
async function resolveParticipants(familyId: string, ids: string[] | undefined) {
  const members = await prisma.membership.findMany({ where: { familyId }, select: { userId: true } });
  const memberIds = members.map((m) => m.userId);
  if (!ids) return memberIds;
  const valid = [...new Set(ids)].filter((id) => memberIds.includes(id));
  return valid.length ? valid : memberIds;
}

function checkDates(startAt: Date, endAt: Date | null) {
  return !endAt || endAt >= startAt;
}

export const eventRoutes = new Elysia({ prefix: "/api/families/:familyId/events" })
  .use(authGuard)
  .get(
    "/",
    async ({ user, params, query }) => {
      await requireMembership(user.id, params.familyId);
      const from = new Date(query.from);
      const to = new Date(query.to);
      const events = await prisma.event.findMany({
        where: {
          familyId: params.familyId,
          startAt: { lt: to },
          OR: [{ startAt: { gte: from } }, { endAt: { gte: from } }],
        },
        select: eventSelect,
        orderBy: { startAt: "asc" },
      });
      return events.map(serialize);
    },
    {
      auth: true,
      query: t.Object({ from: t.String({ format: "date-time" }), to: t.String({ format: "date-time" }) }),
    },
  )
  .get(
    "/countdowns",
    async ({ user, params }) => {
      await requireMembership(user.id, params.familyId);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const events = await prisma.event.findMany({
        where: { familyId: params.familyId, isCountdown: true, startAt: { gte: startOfToday } },
        select: eventSelect,
        orderBy: { startAt: "asc" },
        take: 10,
      });
      return events.map(serialize);
    },
    { auth: true },
  )
  .post(
    "/",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const startAt = new Date(body.startAt);
      const endAt = body.endAt ? new Date(body.endAt) : null;
      if (!checkDates(startAt, endAt)) return status(400, { error: "La fin est avant le début" });
      const participantIds = await resolveParticipants(params.familyId, body.participantIds);

      const event = await prisma.$transaction(async (tx) => {
        const event = await tx.event.create({
          data: {
            familyId: params.familyId,
            createdById: user.id,
            title: body.title.trim(),
            startAt,
            endAt,
            allDay: body.allDay ?? false,
            location: body.location?.trim() || null,
            note: body.note?.trim() || null,
            isCountdown: body.isCountdown ?? false,
            participants: { create: participantIds.map((userId) => ({ userId })) },
          },
          select: eventSelect,
        });
        await recordActivity(tx, {
          familyId: params.familyId,
          actorId: user.id,
          type: "event.added",
          payload: { eventId: event.id, title: event.title, startAt: event.startAt.toISOString(), allDay: event.allDay },
        });
        return event;
      });
      publish(params.familyId, ["events", "activity"]);
      // On prévient l'autre seulement quand ça le concerne
      const others = participantIds.filter((id) => id !== user.id);
      if (others.length) {
        const when = event.startAt.toLocaleString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          ...(event.allDay ? {} : { hour: "2-digit", minute: "2-digit" }),
          timeZone: "Europe/Paris",
        });
        notifyLater(others, "event.added", {
          title: `${await firstNameOf(user.id)} a prévu quelque chose`,
          body: `📅 ${event.title} — ${when}`,
          url: "/agenda",
          tag: "event-added",
        });
      }
      return serialize(event);
    },
    { auth: true, body: eventBody },
  )
  .patch(
    "/:eventId",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const existing = await prisma.event.findFirst({
        where: { id: params.eventId, familyId: params.familyId },
      });
      if (!existing) return status(404, { error: "Événement introuvable" });

      const startAt = body.startAt ? new Date(body.startAt) : existing.startAt;
      const endAt = body.endAt === undefined ? existing.endAt : body.endAt ? new Date(body.endAt) : null;
      if (!checkDates(startAt, endAt)) return status(400, { error: "La fin est avant le début" });
      const participantIds = body.participantIds
        ? await resolveParticipants(params.familyId, body.participantIds)
        : undefined;

      const event = await prisma.$transaction(async (tx) => {
        const event = await tx.event.update({
          where: { id: existing.id },
          data: {
            title: body.title?.trim(),
            startAt,
            endAt,
            allDay: body.allDay,
            location: body.location === undefined ? undefined : body.location?.trim() || null,
            note: body.note === undefined ? undefined : body.note?.trim() || null,
            isCountdown: body.isCountdown,
            // Nouvelle heure : le rappel doit repartir
            reminderSentAt: startAt.getTime() !== existing.startAt.getTime() ? null : undefined,
            participants: participantIds && {
              deleteMany: {},
              create: participantIds.map((userId) => ({ userId })),
            },
          },
          select: eventSelect,
        });
        // On ne signale à l'autre que les changements qui comptent (titre, date)
        if (event.title !== existing.title || event.startAt.getTime() !== existing.startAt.getTime()) {
          await recordActivity(tx, {
            familyId: params.familyId,
            actorId: user.id,
            type: "event.updated",
            payload: { eventId: event.id, title: event.title, startAt: event.startAt.toISOString(), allDay: event.allDay },
          });
        }
        return event;
      });
      publish(params.familyId, ["events", "activity"]);
      return serialize(event);
    },
    { auth: true, body: t.Partial(eventBody) },
  )
  .delete(
    "/:eventId",
    async ({ user, params, status }) => {
      await requireMembership(user.id, params.familyId);
      const { count } = await prisma.event.deleteMany({
        where: { id: params.eventId, familyId: params.familyId },
      });
      if (!count) return status(404, { error: "Événement introuvable" });
      publish(params.familyId, ["events"]);
      return { ok: true };
    },
    { auth: true },
  );
