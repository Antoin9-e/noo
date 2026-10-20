import { Elysia } from "elysia";
import { auth } from "./lib/auth.js";
import { meRoutes } from "./modules/me/routes.js";
import { familyRoutes } from "./modules/family/routes.js";
import { eventRoutes } from "./modules/events/routes.js";
import { wishRoutes } from "./modules/wishes/routes.js";
import { searchRoutes } from "./modules/search/routes.js";
import { activityRoutes } from "./modules/activity/routes.js";
import { realtimeRoutes } from "./modules/realtime/ws.js";
import { pushRoutes } from "./modules/push/routes.js";

// L'app sans `listen`, pour pouvoir la tester avec app.handle()
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
  .use(realtimeRoutes)
  .use(pushRoutes)
  .get("/api/health", () => ({ ok: true }));
