import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { app } from "../src/app.js";
import { setRealtimeServer } from "../src/modules/realtime/publish.js";
import { api, createFamily, createUser, type TestUser } from "./helpers.js";

describe("Fil d'activité & temps réel", () => {
  let toi: TestUser;
  let elle: TestUser;
  let intrus: TestUser;
  let familyId: string;
  let port: number;

  beforeAll(async () => {
    toi = await createUser("Toi");
    elle = await createUser("Elle");
    intrus = await createUser("Intrus");
    familyId = (await createFamily(toi, elle)).id;
    app.listen(0);
    port = app.server!.port!;
    setRealtimeServer(app.server);
  });

  afterAll(async () => {
    setRealtimeServer(null);
    await app.stop();
  });

  it("réagit à une activité de l'autre (une réaction par personne)", async () => {
    await api(elle, "POST", `/api/families/${familyId}/wishes`, { category: "MOVIE", title: "Her" });
    const feed = await api(toi, "GET", `/api/families/${familyId}/activity`);
    const activity = feed.body[0];
    expect(activity).toMatchObject({ actorId: elle.id, type: "wish.added" });

    await api(toi, "PUT", `/api/families/${familyId}/activity/${activity.id}/reaction`, { emoji: "❤️" });
    await api(toi, "PUT", `/api/families/${familyId}/activity/${activity.id}/reaction`, { emoji: "🔥" });
    const after = await api(elle, "GET", `/api/families/${familyId}/activity`);
    expect(after.body[0].reactions).toEqual([{ userId: toi.id, emoji: "🔥" }]);

    await api(toi, "DELETE", `/api/families/${familyId}/activity/${activity.id}/reaction`);
    expect((await api(toi, "GET", `/api/families/${familyId}/activity`)).body[0].reactions).toEqual([]);
  });

  it("refuse un emoji inconnu et les non-membres", async () => {
    const feed = await api(toi, "GET", `/api/families/${familyId}/activity`);
    expect((await api(toi, "PUT", `/api/families/${familyId}/activity/${feed.body[0].id}/reaction`, { emoji: "💩" })).status).toBe(422);
    expect((await api(intrus, "GET", `/api/families/${familyId}/activity`)).status).toBe(403);
  });

  it("prévient l'autre en temps réel après une mutation", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`, { headers: { cookie: elle.cookie } } as any);
    const messages: any[] = [];
    await new Promise<void>((resolve, reject) => {
      ws.onmessage = (e) => {
        const msg = JSON.parse(String(e.data));
        messages.push(msg);
        if (msg.type === "ready") resolve();
      };
      ws.onerror = reject;
    });

    await api(toi, "POST", `/api/families/${familyId}/events`, { title: "Ciné", startAt: "2030-01-01T19:00:00.000Z" });
    await Bun.sleep(100);
    ws.close();

    expect(messages).toContainEqual({
      type: "invalidate",
      keys: [["events", familyId], ["activity", familyId]],
    });
  });

  it("ferme la connexion sans session", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    const code = await new Promise<number>((resolve) => (ws.onclose = (e) => resolve(e.code)));
    expect(code).toBe(4401);
  });
});
