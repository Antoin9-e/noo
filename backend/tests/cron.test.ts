import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "../src/app.js";
import { env } from "../src/lib/env.js";
import { BASE } from "./helpers.js";

const call = (method: string, authorization?: string) =>
  app.handle(
    new Request(`${BASE}/api/cron/reminders`, {
      method,
      headers: authorization ? { authorization } : {},
    }),
  );

describe("Cron des rappels", () => {
  beforeAll(() => {
    env.cronSecret = "secret-de-test";
  });

  it("refuse sans le bon secret", async () => {
    expect((await call("GET")).status).toBe(401);
    expect((await call("POST", "Bearer mauvais")).status).toBe(401);
  });

  it("lance les rappels avec le secret (GET ou POST)", async () => {
    for (const method of ["GET", "POST"]) {
      const res = await call(method, "Bearer secret-de-test");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    }
  });

  it("reste fermé si aucun secret n'est configuré", async () => {
    env.cronSecret = "";
    expect((await call("GET", "Bearer ")).status).toBe(401);
  });
});
