import { describe, it, expect } from "bun:test";
import { app } from "../src/app.js";
import { BASE, createUser } from "./helpers.js";

const upload = async (cookie: string, file: File) => {
  const form = new FormData();
  form.append("image", file);
  return app.handle(new Request(`${BASE}/api/me/avatar`, { method: "POST", headers: { cookie }, body: form }));
};

describe("Photo de profil", () => {
  it("refuse un fichier qui se fait passer pour une image", async () => {
    const user = await createUser();
    const res = await upload(user.cookie, new File(["<script>alert(1)</script>"], "a.png", { type: "image/png" }));
    expect(res.status).toBe(422);
  });

  it("refuse une image trop lourde", async () => {
    const user = await createUser();
    const big = new Uint8Array(5 * 1024 * 1024);
    const res = await upload(user.cookie, new File([big], "a.jpg", { type: "image/jpeg" }));
    expect(res.status).toBe(422);
  });
});
