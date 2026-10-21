import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const BASE = "http://localhost";

export type TestUser = { id: string; email: string; cookie: string };

let counter = 0;

export async function createUser(name = "Test"): Promise<TestUser> {
  const email = `test-${Date.now()}-${counter++}@noo.test`;
  const res = await app.handle(
    new Request(`${BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password: "password123" }),
    }),
  );
  const data = (await res.json()) as { user: { id: string } };
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return { id: data.user.id, email, cookie };
}

export async function createFamily(...users: TestUser[]) {
  const colors = ["VIOLET", "ORANGE"] as const;
  return prisma.family.create({
    data: {
      name: "Foyer test",
      memberships: {
        create: users.map((u, i) => ({
          userId: u.id,
          role: i === 0 ? ("ADMIN" as const) : ("MEMBER" as const),
          color: colors[i]!,
        })),
      },
    },
  });
}

export async function api(
  user: TestUser | null,
  method: string,
  path: string,
  body?: unknown,
) {
  const headers: Record<string, string> = {};
  if (user) headers.cookie = user.cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await app.handle(
    new Request(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}
