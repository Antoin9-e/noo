import { prisma } from "../../lib/prisma.js";
import { notify } from "./notify.js";

// Rappel 1 h avant chaque événement (vérifié toutes les minutes)
export async function sendDueReminders(now = new Date()) {
  const soon = new Date(now.getTime() + 60 * 60_000);
  const events = await prisma.event.findMany({
    where: { allDay: false, reminderSentAt: null, startAt: { gt: now, lte: soon } },
    select: {
      id: true,
      title: true,
      startAt: true,
      family: { select: { timezone: true } },
      participants: { select: { userId: true } },
    },
  });
  for (const e of events) {
    // On marque d'abord : pas de doublon même si l'envoi est lent
    const { count } = await prisma.event.updateMany({ where: { id: e.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (!count) continue;
    const time = e.startAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: e.family.timezone });
    await notify(
      e.participants.map((p) => p.userId),
      `reminder:${e.id}`,
      { title: `⏰ ${e.title}`, body: `Tout à l'heure, à ${time}`, url: "/agenda", tag: `reminder-${e.id}` },
      { throttle: false },
    );
  }
}

export function startReminderLoop() {
  const tick = () => sendDueReminders().catch((e) => console.error("rappels", e));
  tick();
  return setInterval(tick, 60_000);
}
