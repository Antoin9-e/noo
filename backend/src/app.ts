import { Elysia } from "elysia";
import { auth } from "./lib/auth.js";
import { meRoutes } from "./modules/me/routes.js";
import { familyRoutes } from "./modules/family/routes.js";
import { eventRoutes } from "./modules/events/routes.js";
import { wishRoutes } from "./modules/wishes/routes.js";
import { searchRoutes } from "./modules/search/routes.js";
import { activityRoutes } from "./modules/activity/routes.js";
import { noteRoutes } from "./modules/notes/routes.js";
import { pushRoutes } from "./modules/push/routes.js";
import { cronRoutes } from "./modules/push/cron.js";

// L'app sans `listen` : testée avec app.handle(), servie telle quelle par Vercel
export const app = new Elysia()
  // GET et POST explicites : un `.all` serait masqué par le `GET /*` du front en prod
  .get("/api/auth/*", ({ request }) => auth.handler(request))
  .post("/api/auth/*", ({ request }) => auth.handler(request))
  .use(meRoutes)
  .use(familyRoutes)
  .use(eventRoutes)
  .use(wishRoutes)
  .use(searchRoutes)
  .use(activityRoutes)
  .use(noteRoutes)
  .use(pushRoutes)
  .use(cronRoutes)
  .get("/api/health", () => ({ ok: true }));

export default app;
