import { describe, it, expect, beforeAll } from "vitest";
import { Elysia } from "elysia";
import { auth } from "../src/lib/auth.js";

describe("Authentication API", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().all("/api/auth/*", ({ request }) =>
      auth.handler(request),
    );
  });

  it("should register a new user", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          name: "Test User",
          password: "Password123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user?.email).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    const email = `duplicate${Date.now()}@example.com`;

    // Première inscription
    await app.handle(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: "User",
          password: "Password123",
        }),
      }),
    );

    // Deuxième inscription avec même email
    const response = await app.handle(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: "User 2",
          password: "Password456",
        }),
      }),
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("should login with correct credentials", async () => {
    const email = `login${Date.now()}@example.com`;
    const password = "Password123";

    // D'abord créer un utilisateur
    await app.handle(
      new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: "Login Test User",
          password: password,
        }),
      }),
    );

    // Ensuite se connecter
    const response = await app.handle(
      new Request("http://localhost/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const cookies = response.headers.get("set-cookie");
    expect(cookies).toBeTruthy(); // Vérifie que le cookie session est présent
  });
});
