import { describe, it, expect, beforeAll } from "bun:test";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Elysia } from "elysia";
import { app } from "../src/app.js";
import { serveFrontend } from "../src/lib/static.js";
import { createUser } from "./helpers.js";

// Reproduit le montage de prod : API + front statique dans la même app
describe("Front servi par Elysia (prod)", () => {
  let prod: Elysia;

  beforeAll(async () => {
    const dist = await mkdtemp(join(tmpdir(), "noo-dist-"));
    await writeFile(join(dist, "index.html"), "<!doctype html><title>Noo</title>");
    await mkdir(join(dist, "assets"));
    await writeFile(join(dist, "assets", "app.js"), "console.log(1)");
    prod = new Elysia().use(app).use(serveFrontend(dist)) as unknown as Elysia;
  });

  it("garde la session accessible (GET /api/auth/get-session)", async () => {
    const user = await createUser("Prod");
    const res = await prod.handle(new Request("http://localhost/api/auth/get-session", { headers: { cookie: user.cookie } }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as any).user.id).toBe(user.id);
  });

  it("sert index.html pour les routes du front et les assets en cache long", async () => {
    const page = await prod.handle(new Request("http://localhost/envies/films"));
    expect(await page.text()).toContain("<title>Noo</title>");
    const asset = await prod.handle(new Request("http://localhost/assets/app.js"));
    expect(asset.headers.get("cache-control")).toContain("immutable");
  });

  it("répond 404 JSON pour une API inconnue", async () => {
    const res = await prod.handle(new Request("http://localhost/api/nope"));
    expect(res.status).toBe(404);
  });

  it("refuse de sortir du dossier", async () => {
    const res = await prod.handle(new Request("http://localhost/..%2F..%2Fetc%2Fpasswd"));
    expect(await res.text()).toContain("<title>Noo</title>");
  });
});
