import { describe, it, expect, beforeAll, beforeEach, spyOn } from "bun:test";
import webpush from "web-push";
import { api, createFamily, createUser, type TestUser } from "./helpers.js";
import { parseSpotify } from "../src/lib/spotify.js";
import { pushEnabled } from "../src/modules/push/notify.js";

const TRACK = "4cOdK2wGLETKBW3PvgPWqT";
const PAGE = `<html><head>
<meta property="og:title" content="Never Gonna Give You Up"/>
<meta property="og:description" content="Rick Astley · Whenever You Need Somebody · Song · 1987"/>
<meta property="og:image" content="https://i.scdn.co/image/cover"/>
</head></html>`;

// Pas de réseau en test : open.spotify.com répond une page figée
const fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async () => new Response(PAGE)) as unknown as typeof fetch);
const send = spyOn(webpush, "sendNotification").mockResolvedValue({ statusCode: 201, body: "", headers: {} });
const flush = () => Bun.sleep(50);

describe("Liens Spotify", () => {
  it("reconnaît les liens web, localisés et les URI", () => {
    expect(parseSpotify(`https://open.spotify.com/track/${TRACK}?si=abc`)).toEqual({ type: "track", id: TRACK });
    expect(parseSpotify(`Écoute ça https://open.spotify.com/intl-fr/album/${TRACK}`)).toEqual({ type: "album", id: TRACK });
    expect(parseSpotify(`spotify:playlist:${TRACK}`)).toEqual({ type: "playlist", id: TRACK });
    expect(parseSpotify("https://www.deezer.com/track/123")).toBeNull();
  });
});

describe("Nos mots", () => {
  let toi: TestUser;
  let elle: TestUser;
  let intrus: TestUser;
  let familyId: string;
  const base = () => `/api/families/${familyId}/notes`;

  beforeAll(async () => {
    toi = await createUser("Toi");
    elle = await createUser("Elle");
    intrus = await createUser("Intrus");
    familyId = (await createFamily(toi, elle)).id;
    await api(elle, "POST", "/api/push/subscribe", { endpoint: `https://push.example/elle-${Date.now()}`, keys: { p256dh: "p", auth: "a" } });
  });

  beforeEach(() => send.mockClear());

  it("partage une musique avec pochette, titre et artiste", async () => {
    const res = await api(toi, "POST", base(), { text: "Ça me fait penser à toi", spotifyUrl: `https://open.spotify.com/track/${TRACK}?si=x`, notify: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      authorId: toi.id,
      text: "Ça me fait penser à toi",
      spotifyType: "track",
      spotifyId: TRACK,
      musicTitle: "Never Gonna Give You Up",
      musicArtist: "Rick Astley",
      musicImage: "https://i.scdn.co/image/cover",
      notified: false,
      readAt: null,
    });
    expect(fetchSpy).toHaveBeenCalledWith(`https://open.spotify.com/track/${TRACK}`, expect.anything());
  });

  it("refuse un mot vide ou un lien qui n'est pas Spotify", async () => {
    expect((await api(toi, "POST", base(), { text: "   ", notify: false })).status).toBe(400);
    expect((await api(toi, "POST", base(), { spotifyUrl: "https://example.com", notify: false })).status).toBe(400);
  });

  it("un mot posé ne notifie pas, un mot envoyé si", async () => {
    await api(toi, "POST", base(), { text: "Bisous", notify: false });
    await flush();
    expect(send).not.toHaveBeenCalled();

    await api(toi, "POST", base(), { text: "Tu me manques", notify: true });
    await api(toi, "POST", base(), { text: "Vraiment", notify: true });
    await flush();
    if (!pushEnabled) return;
    // Jamais limité : deux mots, deux notifs
    expect(send).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(send.mock.calls[0]![1]))).toMatchObject({ title: "Un mot de Toi", body: "Tu me manques", url: "/mots" });
  });

  it("marque lus les mots de l'autre, pas les siens", async () => {
    await api(elle, "POST", `${base()}/read`);
    const notes = (await api(toi, "GET", base())).body as Array<{ authorId: string; readAt: string | null }>;
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.readAt !== null)).toBe(true);

    await api(elle, "POST", base(), { text: "Moi aussi", notify: false });
    await api(elle, "POST", `${base()}/read`);
    expect((await api(toi, "GET", base())).body[0]).toMatchObject({ authorId: elle.id, readAt: null });
  });

  it("réagit et supprime (chacun peut supprimer)", async () => {
    const note = (await api(toi, "GET", base())).body[0];
    await api(toi, "PUT", `${base()}/${note.id}/reaction`, { emoji: "🥹" });
    expect((await api(elle, "GET", base())).body[0].reactions).toEqual([{ userId: toi.id, emoji: "🥹" }]);

    expect((await api(toi, "DELETE", `${base()}/${note.id}`)).status).toBe(200);
    expect((await api(elle, "GET", base())).body.find((n: { id: string }) => n.id === note.id)).toBeUndefined();
    expect((await api(toi, "DELETE", `${base()}/${note.id}`)).status).toBe(404);
  });

  it("ferme la porte aux non-membres", async () => {
    expect((await api(intrus, "GET", base())).status).toBe(403);
    expect((await api(intrus, "POST", base(), { text: "Coucou", notify: true })).status).toBe(403);
  });
});
