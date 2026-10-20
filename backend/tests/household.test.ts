import { describe, it, expect, beforeAll } from "bun:test";
import { api, createUser, type TestUser } from "./helpers.js";
import { prisma } from "../src/lib/prisma.js";

describe("Foyer & invitations", () => {
  let toi: TestUser;
  let elle: TestUser;
  let familyId: string;

  beforeAll(async () => {
    toi = await createUser("Toi");
    elle = await createUser("Elle");
  });

  it("crée un foyer dont le créateur est admin avec sa couleur", async () => {
    const res = await api(toi, "POST", "/api/families", { name: "Chez nous", color: "ORANGE" });
    expect(res.status).toBe(200);
    familyId = res.body.id;
    expect(res.body.memberships).toEqual([
      expect.objectContaining({ role: "ADMIN", color: "ORANGE" }),
    ]);
  });

  it("invite puis accepte avec la couleur libre", async () => {
    const inv = await api(toi, "POST", `/api/families/${familyId}/invitations`);
    expect(inv.status).toBe(200);

    const preview = await api(null, "GET", `/api/invitations/${inv.body.token}`);
    expect(preview.body).toMatchObject({ familyName: "Chez nous", valid: true, inviter: { name: "Toi" } });

    const accept = await api(elle, "POST", `/api/invitations/${inv.body.token}/accept`);
    expect(accept.status).toBe(200);
    expect(accept.body.familyId).toBe(familyId);

    const family = await api(elle, "GET", `/api/families/${familyId}`);
    const mine = family.body.memberships.find((m: any) => m.user.id === elle.id);
    expect(mine).toMatchObject({ role: "MEMBER", color: "VIOLET" });
  });

  it("refuse un lien déjà utilisé", async () => {
    const inv = await api(toi, "POST", `/api/families/${familyId}/invitations`);
    const intrus = await createUser("Intrus");
    await prisma.invitation.update({ where: { token: inv.body.token }, data: { usedAt: new Date() } });
    expect((await api(intrus, "POST", `/api/invitations/${inv.body.token}/accept`)).status).toBe(410);
  });

  it("refuse un lien expiré", async () => {
    const inv = await api(toi, "POST", `/api/families/${familyId}/invitations`);
    const intrus = await createUser("Intrus");
    await prisma.invitation.update({ where: { token: inv.body.token }, data: { expiresAt: new Date(0) } });
    expect((await api(intrus, "POST", `/api/invitations/${inv.body.token}/accept`)).status).toBe(410);
    expect((await api(null, "GET", `/api/invitations/${inv.body.token}`)).body.valid).toBe(false);
  });

  it("est idempotent pour un membre existant", async () => {
    const inv = await api(toi, "POST", `/api/families/${familyId}/invitations`);
    const res = await api(elle, "POST", `/api/invitations/${inv.body.token}/accept`);
    expect(res.status).toBe(200);
    expect(res.body.alreadyMember).toBe(true);
  });

  it("refuse un troisième membre quand les couleurs sont prises", async () => {
    const inv = await api(toi, "POST", `/api/families/${familyId}/invitations`);
    const intrus = await createUser("Intrus");
    expect((await api(intrus, "POST", `/api/invitations/${inv.body.token}/accept`)).status).toBe(409);
  });

  it("invalide l'ancien lien quand on en génère un nouveau", async () => {
    const first = await api(toi, "POST", `/api/families/${familyId}/invitations`);
    await api(toi, "POST", `/api/families/${familyId}/invitations`);
    expect((await api(null, "GET", `/api/invitations/${first.body.token}`)).body.valid).toBe(false);
  });

  it("404 sur un lien inconnu", async () => {
    expect((await api(null, "GET", "/api/invitations/nope")).status).toBe(404);
  });

  it("échange les couleurs", async () => {
    const res = await api(elle, "PATCH", `/api/families/${familyId}/me`, { color: "ORANGE" });
    expect(res.status).toBe(200);
    const byUser = Object.fromEntries(res.body.memberships.map((m: any) => [m.user.id, m]));
    expect(byUser[elle.id]).toMatchObject({ color: "ORANGE", role: "MEMBER" });
    expect(byUser[toi.id]).toMatchObject({ color: "VIOLET", role: "ADMIN" });
  });

  it("réserve le renommage à l'admin", async () => {
    expect((await api(elle, "PATCH", `/api/families/${familyId}`, { name: "X" })).status).toBe(403);
    const ok = await api(toi, "PATCH", `/api/families/${familyId}`, { name: "Notre nid" });
    expect(ok.body.name).toBe("Notre nid");
  });

  it("n'invite pas dans un foyer dont on n'est pas membre", async () => {
    const intrus = await createUser("Intrus");
    expect((await api(intrus, "POST", `/api/families/${familyId}/invitations`)).status).toBe(403);
  });
});
