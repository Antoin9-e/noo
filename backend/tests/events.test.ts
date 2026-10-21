import { describe, it, expect, beforeAll } from "bun:test";
import { api, createFamily, createUser, type TestUser } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";

describe("Agenda", () => {
  let toi: TestUser;
  let elle: TestUser;
  let intrus: TestUser;
  let familyId: string;
  let otherFamilyId: string;
  let eventId: string;

  beforeAll(async () => {
    toi = await createUser("Toi");
    elle = await createUser("Elle");
    intrus = await createUser("Intrus");
    familyId = (await createFamily(toi, elle)).id;
    otherFamilyId = (await createFamily(intrus)).id;
  });

  it("crée un événement pour tout le foyer par défaut et l'inscrit au fil", async () => {
    const res = await api(toi, "POST", `/api/families/${familyId}/events`, {
      title: "Resto chez Paul",
      startAt: "2030-05-10T18:30:00.000Z",
    });
    expect(res.status).toBe(200);
    eventId = res.body.id;
    expect(res.body.participantIds.sort()).toEqual([toi.id, elle.id].sort());

    const activity = await prisma.activity.findFirst({ where: { familyId, type: "event.added" } });
    expect(activity?.payload).toMatchObject({ eventId, title: "Resto chez Paul" });
  });

  it("ignore les participants hors du foyer", async () => {
    const res = await api(toi, "POST", `/api/families/${familyId}/events`, {
      title: "Sport",
      startAt: "2030-05-11T07:00:00.000Z",
      participantIds: [toi.id, intrus.id],
    });
    expect(res.body.participantIds).toEqual([toi.id]);
  });

  it("liste les événements d'une plage", async () => {
    const res = await api(elle, "GET", `/api/families/${familyId}/events?from=2030-05-10T00:00:00.000Z&to=2030-05-11T00:00:00.000Z`);
    expect(res.status).toBe(200);
    expect(res.body.map((e: any) => e.title)).toEqual(["Resto chez Paul"]);
  });

  it("refuse la fin avant le début", async () => {
    const res = await api(toi, "POST", `/api/families/${familyId}/events`, {
      title: "Bug",
      startAt: "2030-05-10T18:00:00.000Z",
      endAt: "2030-05-10T17:00:00.000Z",
    });
    expect(res.status).toBe(400);
  });

  it("modifie un événement et le signale", async () => {
    const res = await api(elle, "PATCH", `/api/families/${familyId}/events/${eventId}`, {
      startAt: "2030-05-10T19:00:00.000Z",
      participantIds: [elle.id],
    });
    expect(res.status).toBe(200);
    expect(res.body.participantIds).toEqual([elle.id]);
    const count = await prisma.activity.count({ where: { familyId, type: "event.updated" } });
    expect(count).toBe(1);
  });

  it("isole les foyers", async () => {
    const list = `/api/families/${familyId}/events?from=2030-01-01T00:00:00.000Z&to=2031-01-01T00:00:00.000Z`;
    expect((await api(intrus, "GET", list)).status).toBe(403);
    expect((await api(intrus, "PATCH", `/api/families/${otherFamilyId}/events/${eventId}`, { title: "Pirate" })).status).toBe(404);
    expect((await api(intrus, "DELETE", `/api/families/${otherFamilyId}/events/${eventId}`)).status).toBe(404);
  });

  it("liste les comptes à rebours à venir", async () => {
    await api(toi, "POST", `/api/families/${familyId}/events`, {
      title: "Lisbonne",
      startAt: "2030-07-01T00:00:00.000Z",
      allDay: true,
      isCountdown: true,
    });
    const res = await api(toi, "GET", `/api/families/${familyId}/events/countdowns`);
    expect(res.body.map((e: any) => e.title)).toEqual(["Lisbonne"]);
  });

  it("supprime un événement", async () => {
    expect((await api(toi, "DELETE", `/api/families/${familyId}/events/${eventId}`)).status).toBe(200);
    expect(await prisma.event.findUnique({ where: { id: eventId } })).toBeNull();
  });
});
