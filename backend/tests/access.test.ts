import { describe, it, expect, beforeAll } from "bun:test";
import { api, createFamily, createUser, type TestUser } from "./helpers.js";

describe("Contrôle d'accès", () => {
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

  it("refuse /api/me sans session", async () => {
    expect((await api(null, "GET", "/api/me")).status).toBe(401);
  });

  it("renvoie mes foyers avec ma couleur", async () => {
    const res = await api(toi, "GET", "/api/me");
    expect(res.status).toBe(200);
    expect(res.body.memberships[0].family.id).toBe(familyId);
    expect(res.body.memberships[0].color).toBe("VIOLET");
  });

  it("n'expose plus de liste globale d'utilisateurs ni de foyers", async () => {
    expect((await api(toi, "GET", "/api/users")).status).toBe(404);
    expect((await api(toi, "GET", "/api/families")).status).toBe(404);
  });

  it("donne le foyer à un membre", async () => {
    const res = await api(elle, "GET", `/api/families/${familyId}`);
    expect(res.status).toBe(200);
    expect(res.body.memberships).toHaveLength(2);
  });

  it("refuse le foyer à un non-membre", async () => {
    expect((await api(intrus, "GET", `/api/families/${familyId}`)).status).toBe(403);
    expect((await api(null, "GET", `/api/families/${familyId}`)).status).toBe(401);
  });

  it("modifie mon nom", async () => {
    const res = await api(toi, "PATCH", "/api/me", { name: "  Antoine " });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Antoine");
  });
});
