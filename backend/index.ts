import { app } from "./src/app.js";
import { env } from "./src/lib/env.js";
import { serveFrontend } from "./src/lib/static.js";
import { startReminderLoop } from "./src/modules/push/reminders.js";

if (env.isProd) {
  app.use(serveFrontend(process.env.FRONTEND_DIST ?? "../frontend/dist"));
}

app.listen(env.port);
// Serveur permanent (dev, Docker) : rappels en interne. Sur Vercel : /api/cron/reminders
startReminderLoop();

console.log(`🦊 Noo tourne sur http://localhost:${env.port}`);
