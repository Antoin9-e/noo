import { app } from "./src/app.js";
import { env } from "./src/lib/env.js";
import { serveFrontend } from "./src/lib/static.js";
import { setRealtimeServer } from "./src/modules/realtime/publish.js";
import { startReminderLoop } from "./src/modules/push/reminders.js";

if (env.isProd) {
  app.use(serveFrontend(process.env.FRONTEND_DIST ?? "../frontend/dist"));
}

app.listen(env.port);
setRealtimeServer(app.server);
startReminderLoop();

console.log(`🦊 Noo tourne sur http://localhost:${env.port}`);
