import { differenceInCalendarDays, format, isSameDay, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h >= 18 || h < 5) return "Bonsoir";
  if (h >= 12) return "Bon après-midi";
  return "Bonjour";
}

export function fmt(date: Date | string | number, pattern: string) {
  return format(typeof date === "string" ? new Date(date) : date, pattern, { locale: fr });
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export const toDateInput = (d: Date) => format(d, "yyyy-MM-dd");
export const toTimeInput = (d: Date) => format(d, "HH:mm");

// "2030-05-10" + "20:30" → Date locale
export function fromInputs(date: string, time = "00:00") {
  return new Date(`${date}T${time}`);
}

export function dayLabel(d: Date) {
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return "Demain";
  return fmt(d, "EEEE d MMMM");
}

export function countdownLabel(d: Date, now = new Date()) {
  const n = differenceInCalendarDays(d, now);
  if (n <= 0) return "C'est aujourd'hui !";
  if (n === 1) return "Demain";
  return `J-${n}`;
}

export function timeRange(e: { startAt: string; endAt: string | null; allDay: boolean }) {
  if (e.allDay) return "Toute la journée";
  const start = new Date(e.startAt);
  if (!e.endAt) return fmt(start, "HH:mm");
  const end = new Date(e.endAt);
  return isSameDay(start, end) ? `${fmt(start, "HH:mm")} – ${fmt(end, "HH:mm")}` : `${fmt(start, "HH:mm")} → ${fmt(end, "d MMM HH:mm")}`;
}
