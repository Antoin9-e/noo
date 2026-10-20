import { Elysia } from "elysia";
import { join, normalize } from "node:path";

// En prod, Elysia sert aussi le front buildé : une seule origine (cookies first-party sur iOS)
export function serveFrontend(distDir: string) {
  const root = normalize(distDir);
  const index = join(root, "index.html");

  return new Elysia({ name: "static" }).get("/*", async ({ path, set }) => {
    if (path.startsWith("/api/")) {
      set.status = 404;
      return { error: "Introuvable" };
    }

    const filePath = normalize(join(root, decodeURIComponent(path)));
    if (filePath.startsWith(root) && filePath !== root) {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        set.headers["cache-control"] = path.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache";
        return file;
      }
    }

    set.headers["cache-control"] = "no-cache";
    return Bun.file(index);
  });
}
