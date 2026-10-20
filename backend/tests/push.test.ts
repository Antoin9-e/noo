import { describe, it, expect, beforeAll, spyOn, beforeEach } from "bun:test";
import webpush from "web-push";
import { api, createFamily, createUser, type TestUser } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";
import { pushEnabled } from "../src/modules/push/notify.js";
import { sendDueReminders } from "../src/modules/push/reminders.js";

const send = spyOn(webpush, "sendNotification").mockResolvedValue({ statusCode: 201, body: "", headers: {} });
const sentTo = () => send.mock.calls.map((c) => [(c[0] as any).endpoint, JSON.parse(String(c[1]))]);
const flush = () => Bun.sleep(50);

describe.skipIf(!pushEnabled)("Notifications push", () => {
  let toi: TestUser;
  let elle: TestUser;
  let familyId: string;
  const elleEndpoint = `https://push.example/elle-${Date.now()}`;
  const toiEndpoint = `https://push.example/toi-${Date.now()}`;

  beforeAll(async () => {
    toi = await createUser("Toi");
    elle = await createUser("Elle");
    familyId = (await createFamily(toi, elle)).id;
    const keys = { p256dh: "p", auth: "a" };
    expect((await api(elle, "POST", "/api/push/subscribe", { endpoint: elleEndpoint, keys })).status).toBe(200);
    await api(toi, "POST", "/api/push/subscribe", { endpoint: toiEndpoint, keys });
  });

  beforeEach(() => send.mockClear());

  it("prévient l'autre d'une nouvelle envie, pas l'auteur", async () => {
    await api(toi, "POST", `/api/families/${familyId}/wishes`, { category: "MOVIE", title: "Her" });
    await flush();
    expect(sentTo()).toEqual([[elleEndpoint, expect.objectContaining({ url: "/envies/match" })]]);
  });

  it("limite à une notification par type toutes les 10 min", async () => {
    await api(toi, "POST", `/api/families/${familyId}/wishes`, { category: "MOVIE", title: "Up" });
    await flush();
    expect(send).not.toHaveBeenCalled();
  });

  it("ne trahit jamais un cadeau", async () => {
    await api(toi, "POST", `/api/families/${familyId}/wishes`, { category: "GIFT", title: "Bague", forUserId: elle.id });
    await flush();
    expect(send).not.toHaveBeenCalled();
  });

  it("annonce un match à l'autre", async () => {
    const wish = await api(elle, "POST", `/api/families/${familyId}/wishes`, { category: "TRIP", title: "Rome" });
    await flush();
    send.mockClear();
    await api(toi, "PUT", `/api/families/${familyId}/wishes/${wish.body.id}/vote`, { vote: "YES" });
    await flush();
    expect(sentTo()).toEqual([[elleEndpoint, expect.objectContaining({ title: "C'est un match ! 💞" })]]);
  });

  it("prévient pour un événement « nous deux », pas pour un événement perso", async () => {
    await api(toi, "POST", `/api/families/${familyId}/events`, { title: "Sport", startAt: "2030-01-01T08:00:00.000Z", participantIds: [toi.id] });
    await flush();
    expect(send).not.toHaveBeenCalled();
    await api(toi, "POST", `/api/families/${familyId}/events`, { title: "Ciné", startAt: "2030-01-01T19:00:00.000Z" });
    await flush();
    expect(sentTo().map(([e]) => e)).toEqual([elleEndpoint]);
  });

  it("envoie un rappel 1 h avant, une seule fois", async () => {
    const now = new Date("2031-03-03T17:00:00.000Z");
    await prisma.event.create({
      data: {
        familyId,
        createdById: toi.id,
        title: "Resto",
        startAt: new Date("2031-03-03T17:45:00.000Z"),
        participants: { create: [{ userId: toi.id }, { userId: elle.id }] },
      },
    });
    send.mockClear();
    await sendDueReminders(now);
    expect(sentTo().map(([e]) => e).sort()).toEqual([elleEndpoint, toiEndpoint].sort());
    send.mockClear();
    await sendDueReminders(now);
    expect(send).not.toHaveBeenCalled();
  });

  it("oublie un abonnement expiré", async () => {
    send.mockRejectedValueOnce(Object.assign(new Error("gone"), { statusCode: 410 }));
    await api(elle, "POST", "/api/push/test");
    expect(await prisma.pushSubscription.findUnique({ where: { endpoint: elleEndpoint } })).toBeNull();
  });
});
