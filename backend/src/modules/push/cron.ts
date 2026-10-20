import { Elysia } from "elysia";
import { env } from "../../lib/env.js";
import { sendDueReminders } from "./reminders.js";

// Appelé chaque minute par un cron externe (pas de process permanent sur Vercel)
async function reminders({ request, status }: { request: Request; status: (code: 401, body: unknown) => unknown }) {
  if (!env.cronSecret || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return status(401, { error: "Non autorisé" });
  }
  await sendDueReminders();
  return { ok: true };
}

// GET et POST : selon ce que le service de cron sait envoyer
export const cronRoutes = new Elysia({ prefix: "/api/cron" }).get("/reminders", reminders).post("/reminders", reminders);
