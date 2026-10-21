import { addDays, isWeekend, startOfDay } from "date-fns";
import type { NooEvent } from "@/types";

export interface FreeSlot {
  start: Date;
  end: Date;
  label: "Soirée" | "Matinée" | "Après-midi";
}

const EVENING: [number, number] = [19, 23];
const MORNING: [number, number] = [9, 13];
const AFTERNOON: [number, number] = [14, 19];

function at(day: Date, hour: number) {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function isBusy(events: NooEvent[], start: Date, end: Date) {
  return events.some((e) => {
    const s = new Date(e.startAt);
    if (e.allDay) {
      const dayEnd = addDays(startOfDay(s), 1);
      return s < end && dayEnd > start;
    }
    const en = e.endAt ? new Date(e.endAt) : new Date(s.getTime() + 2 * 3600_000);
    return s < end && en > start;
  });
}

// Soirées (19h–23h) et demi-journées de week-end sans aucun événement, sur N jours
export function findFreeSlots(events: NooEvent[], from = new Date(), days = 14): FreeSlot[] {
  const slots: FreeSlot[] = [];
  for (let i = 0; i < days; i++) {
    const day = startOfDay(addDays(from, i));
    const candidates: Array<[FreeSlot["label"], [number, number]]> = isWeekend(day)
      ? [["Matinée", MORNING], ["Après-midi", AFTERNOON], ["Soirée", EVENING]]
      : [["Soirée", EVENING]];
    for (const [label, [h1, h2]] of candidates) {
      const start = at(day, h1);
      const end = at(day, h2);
      if (end <= from) continue;
      if (!isBusy(events, start, end)) slots.push({ start, end, label });
    }
  }
  return slots;
}
