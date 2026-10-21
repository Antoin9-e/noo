import { describe, it, expect, beforeAll } from "bun:test";
import { api, createFamily, createUser, type TestUser } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";

describe("Envies & matchs", () => {
  let toi: TestUser;
  let elle: TestUser;
  let intrus: TestUser;
  let familyId: string;
  let base: string;
  let filmId: string;

  beforeAll(async () => {
    toi = await createUser("Toi");
    elle = await createUser("Elle");
    intrus = await createUser("Intrus");
    familyId = (await createFamily(toi, elle)).id;
    base = `/api/families/${familyId}/wishes`;
  });

  it("crée une envie avec un oui automatique du créateur", async () => {
    const res = await api(toi, "POST", base, { category: "MOVIE", title: "Dune 2", year: 2024 });
    expect(res.status).toBe(200);
    filmId = res.body.id;
    expect(res.body).toMatchObject({ myVote: "YES", yesBy: [toi.id], isMatch: false });
    const activity = await prisma.activity.findFirst({ where: { familyId, type: "wish.added" } });
    expect(activity?.payload).toMatchObject({ wishId: filmId, title: "Dune 2" });
  });

  it("propose l'envie à swiper à l'autre seulement", async () => {
    expect((await api(elle, "GET", `${base}/to-swipe`)).body.map((w: any) => w.id)).toEqual([filmId]);
    expect((await api(toi, "GET", `${base}/to-swipe`)).body).toEqual([]);
  });

  it("crée un match quand tout le monde dit oui", async () => {
    const res = await api(elle, "PUT", `${base}/${filmId}/vote`, { vote: "YES" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isMatch: true, justMatched: true });
    expect(await prisma.activity.count({ where: { familyId, type: "wish.matched" } })).toBe(1);

    // Revoter oui ne recrée pas de match
    const again = await api(elle, "PUT", `${base}/${filmId}/vote`, { vote: "YES" });
    expect(again.body.justMatched).toBe(false);
    expect(await prisma.activity.count({ where: { familyId, type: "wish.matched" } })).toBe(1);
    expect((await api(elle, "GET", `${base}/to-swipe`)).body).toEqual([]);
  });

  it("un non défait le match", async () => {
    const res = await api(toi, "PUT", `${base}/${filmId}/vote`, { vote: "NO" });
    expect(res.body.isMatch).toBe(false);
    await api(toi, "PUT", `${base}/${filmId}/vote`, { vote: "YES" });
  });

  it("marque fait puis note", async () => {
    const done = await api(toi, "PATCH", `${base}/${filmId}`, { status: "DONE" });
    expect(done.body.status).toBe("DONE");
    expect(done.body.doneAt).toBeTruthy();
    const rated = await api(elle, "PUT", `${base}/${filmId}/rating`, { rating: 4 });
    expect(rated.body.votes.find((v: any) => v.userId === elle.id)).toMatchObject({ vote: "YES", rating: 4 });
    expect((await api(toi, "GET", `${base}?status=DONE`)).body.map((w: any) => w.id)).toEqual([filmId]);
    expect((await api(toi, "GET", `${base}?status=OPEN`)).body).toEqual([]);
  });

  describe("cadeaux", () => {
    let giftId: string;

    beforeAll(async () => {
      const res = await api(toi, "POST", base, { category: "GIFT", title: "Collier", forUserId: elle.id });
      giftId = res.body.id;
    });

    it("n'a pas de vote ni d'activité", async () => {
      const gift = await prisma.wish.findUnique({ where: { id: giftId }, include: { votes: true } });
      expect(gift?.votes).toEqual([]);
      expect(await prisma.activity.count({ where: { familyId, payload: { path: ["wishId"], equals: giftId } } })).toBe(0);
    });

    it("est invisible pour sa destinataire", async () => {
      expect((await api(elle, "GET", base)).body.map((w: any) => w.id)).not.toContain(giftId);
      expect((await api(elle, "GET", `${base}?category=GIFT`)).body).toEqual([]);
      expect((await api(elle, "PATCH", `${base}/${giftId}`, { title: "?" })).status).toBe(404);
      expect((await api(elle, "DELETE", `${base}/${giftId}`)).status).toBe(404);
      expect((await api(toi, "GET", `${base}?category=GIFT`)).body.map((w: any) => w.id)).toEqual([giftId]);
    });

    it("refuse un vote ou un cadeau pour soi", async () => {
      expect((await api(toi, "PUT", `${base}/${giftId}/vote`, { vote: "YES" })).status).toBe(400);
      expect((await api(toi, "POST", base, { category: "GIFT", title: "Moi", forUserId: toi.id })).status).toBe(400);
    });
  });

  it("isole les foyers", async () => {
    expect((await api(intrus, "GET", base)).status).toBe(403);
    expect((await api(intrus, "PUT", `${base}/${filmId}/vote`, { vote: "YES" })).status).toBe(403);
  });

  it("répond 503 sur la recherche de films sans clé TMDB", async () => {
    if (process.env.TMDB_API_KEY) return;
    expect((await api(toi, "GET", "/api/search/movies?q=dune")).status).toBe(503);
  });
});
