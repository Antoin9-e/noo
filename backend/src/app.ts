import { Elysia } from "elysia";
import { auth } from "./lib/auth.js";
import { meRoutes } from "./modules/me/routes.js";
import { familyRoutes } from "./modules/family/routes.js";

// L'app sans `listen`, pour pouvoir la tester avec app.handle()
export const app = new Elysia()
  .all("/api/auth/*", ({ request }) => auth.handler(request))
  .use(meRoutes)
  .use(familyRoutes)
  .get("/api/health", () => ({ ok: true }));
