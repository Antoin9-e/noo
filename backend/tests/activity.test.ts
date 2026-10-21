import { describe, it, expect, beforeAll } from "bun:test";
import { api, createFamily, createUser, type TestUser } from "./helpers.js";

describe("Fil d'activité", () => {
  let toi: TestUser;
  let elle: TestUser;
  let intrus: TestUser;
  let familyId: string;

  beforeAll(async () => {
    toi = await createUser("Toi");
    elle = await createUser("Elle");
    intrus = await createUser("Intrus");
    familyId = (await createFamily(toi, elle)).id;
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
});
