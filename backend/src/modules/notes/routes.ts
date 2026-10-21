import { Elysia, t } from "elysia";
import { authGuard } from "../../plugins/auth-guard.js";
import { requireMembership } from "../../plugins/family-guard.js";
import { prisma } from "../../lib/prisma.js";
import { lookupSpotify } from "../../lib/spotify.js";
import { firstNameOf, notifyLater, otherMembers } from "../push/notify.js";

const EMOJIS = ["❤️", "😂", "🔥", "👍", "😍", "🥹", "🤤", "🎉"];

const noteSelect = {
  id: true,
  authorId: true,
  text: true,
  spotifyType: true,
  spotifyId: true,
  musicTitle: true,
  musicArtist: true,
  musicImage: true,
  notified: true,
  readAt: true,
  createdAt: true,
  reactions: { select: { userId: true, emoji: true } },
} as const;

async function findNote(familyId: string, noteId: string) {
  return prisma.note.findFirst({ where: { id: noteId, familyId } });
}

export const noteRoutes = new Elysia({ prefix: "/api/families/:familyId/notes" })
  .use(authGuard)
  .get(
    "/",
    async ({ user, params }) => {
      await requireMembership(user.id, params.familyId);
      return prisma.note.findMany({
        where: { familyId: params.familyId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: noteSelect,
      });
    },
    { auth: true },
  )
  // Aperçu pendant la saisie : pochette, titre, artiste
  .get(
    "/spotify",
    async ({ user, params, query, status }) => {
      await requireMembership(user.id, params.familyId);
      const item = await lookupSpotify(query.url);
      if (!item) return status(400, { error: "Ce n'est pas un lien Spotify" });
      return item;
    },
    { auth: true, query: t.Object({ url: t.String({ maxLength: 1000 }) }) },
  )
  .post(
    "/",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const text = body.text?.trim() || null;
      const music = body.spotifyUrl?.trim() ? await lookupSpotify(body.spotifyUrl) : null;
      if (body.spotifyUrl?.trim() && !music) return status(400, { error: "Ce n'est pas un lien Spotify" });
      if (!text && !music) return status(400, { error: "Un mot ou une musique, au moins 😉" });

      const note = await prisma.note.create({
        data: {
          familyId: params.familyId,
          authorId: user.id,
          text,
          spotifyType: music?.type,
          spotifyId: music?.id,
          musicTitle: music?.title,
          musicArtist: music?.artist,
          musicImage: music?.image,
          notified: body.notify,
        },
        select: noteSelect,
      });

      if (body.notify) {
        const [name, recipients] = await Promise.all([firstNameOf(user.id), otherMembers(params.familyId, user.id)]);
        const song = music && `${music.title ?? "Une musique"}${music.artist ? ` · ${music.artist}` : ""}`;
        // Un mot est envoyé exprès : jamais limité, et chacun reste dans le centre de notifs
        notifyLater(
          recipients,
          "note",
          {
            title: music && !text ? `${name} t'a partagé une musique` : `Un mot de ${name}`,
            body: [text, song].filter(Boolean).join("\n"),
            url: "/mots",
            tag: `note-${note.id}`,
          },
          { throttle: false },
        );
      }
      return note;
    },
    {
      auth: true,
      body: t.Object({
        text: t.Optional(t.Nullable(t.String({ maxLength: 1000 }))),
        spotifyUrl: t.Optional(t.Nullable(t.String({ maxLength: 1000 }))),
        notify: t.Boolean(),
      }),
    },
  )
  // Ouverture de « Nos mots » : tout ce que l'autre a écrit devient lu
  .post(
    "/read",
    async ({ user, params }) => {
      await requireMembership(user.id, params.familyId);
      await prisma.note.updateMany({
        where: { familyId: params.familyId, authorId: { not: user.id }, readAt: null },
        data: { readAt: new Date() },
      });
      return { ok: true };
    },
    { auth: true },
  )
  // Espace partagé : chacun peut faire le ménage
  .delete(
    "/:noteId",
    async ({ user, params, status }) => {
      await requireMembership(user.id, params.familyId);
      const note = await findNote(params.familyId, params.noteId);
      if (!note) return status(404, { error: "Mot introuvable" });
      await prisma.note.delete({ where: { id: note.id } });
      return { ok: true };
    },
    { auth: true },
  )
  .put(
    "/:noteId/reaction",
    async ({ user, params, body, status }) => {
      await requireMembership(user.id, params.familyId);
      const note = await findNote(params.familyId, params.noteId);
      if (!note) return status(404, { error: "Mot introuvable" });
      await prisma.noteReaction.upsert({
        where: { noteId_userId: { noteId: note.id, userId: user.id } },
        create: { noteId: note.id, userId: user.id, emoji: body.emoji },
        update: { emoji: body.emoji },
      });
      return { ok: true };
    },
    { auth: true, body: t.Object({ emoji: t.Union(EMOJIS.map((e) => t.Literal(e))) }) },
  )
  .delete(
    "/:noteId/reaction",
    async ({ user, params }) => {
      await requireMembership(user.id, params.familyId);
      await prisma.noteReaction.deleteMany({
        where: { noteId: params.noteId, userId: user.id, note: { familyId: params.familyId } },
      });
      return { ok: true };
    },
    { auth: true },
  );
