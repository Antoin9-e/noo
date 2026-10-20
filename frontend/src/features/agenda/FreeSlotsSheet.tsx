import { useMemo } from "react";
import { addDays, startOfDay } from "date-fns";
import { Sheet } from "@/components/common/Sheet";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useUi } from "@/stores/ui";
import { dayLabel, fmt } from "@/lib/dates";
import { tap } from "@/lib/haptics";
import { useEvents } from "./hooks";
import { findFreeSlots } from "./freeSlots";

const EMOJI = { Soirée: "🌙", Matinée: "☀️", "Après-midi": "🌤️" } as const;

export function FreeSlotsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const from = useMemo(() => startOfDay(new Date()), []);
  const to = useMemo(() => addDays(from, 14), [from]);
  const { data: events, isLoading } = useEvents(from, to);
  const openEvent = useUi((s) => s.openEvent);
  const slots = useMemo(() => (events ? findFreeSlots(events) : []), [events]);

  const pick = (start: Date, end: Date) => {
    tap();
    onOpenChange(false);
    const s = new Date(start);
    if (s.getHours() === 19) s.setHours(20, 0); // une soirée commence plutôt vers 20h
    openEvent({ startAt: s.toISOString(), endAt: end.toISOString(), forWhom: "both" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="On est libres quand ?" description="Vos créneaux libres sur les 2 prochaines semaines">
      {isLoading ? (
        <div className="space-y-2 pb-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : slots.length === 0 ? (
        <EmptyState emoji="🗓️" title="Aucun créneau libre">Agenda bien rempli ! Peut-être le mois prochain ?</EmptyState>
      ) : (
        <ul className="space-y-2 pb-2">
          {slots.map((slot) => (
            <li key={slot.start.toISOString()}>
              <button
                type="button"
                onClick={() => pick(slot.start, slot.end)}
                className="pressable flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left shadow-card"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-noo-soft text-[20px]">{EMOJI[slot.label]}</span>
                <span className="flex-1">
                  <span className="block font-semibold first-letter:uppercase">{dayLabel(slot.start)}</span>
                  <span className="text-caption text-ink-3">
                    {slot.label} · {fmt(slot.start, "HH'h'")}–{fmt(slot.end, "HH'h'")}
                  </span>
                </span>
                <span className="text-caption font-semibold text-violet">Planifier</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
