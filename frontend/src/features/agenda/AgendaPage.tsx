import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarHeart, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { dayLabel, fmt } from "@/lib/dates";
import { useSwipe } from "@/lib/useSwipe";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { NooEvent } from "@/types";
import { useEvents } from "./hooks";
import { EventRow } from "./EventRow";
import { DayDots } from "./DayDots";
import { FreeSlotsSheet } from "./FreeSlotsSheet";

type View = "week" | "month";
const WEEK = { weekStartsOn: 1 } as const;

function eventsOn(events: NooEvent[] | undefined, day: Date) {
  if (!events) return [];
  const start = startOfDay(day);
  const end = addDays(start, 1);
  return events.filter((e) => {
    const s = new Date(e.startAt);
    const en = e.endAt ? new Date(e.endAt) : s;
    return s < end && en >= start;
  });
}

export default function AgendaPage() {
  const [view, setView] = useState<View>("week");
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [freeOpen, setFreeOpen] = useState(false);
  const { members } = useHousehold();
  const openEvent = useUi((s) => s.openEvent);

  const range = useMemo(() => {
    if (view === "week") return { from: startOfWeek(selected, WEEK), to: startOfDay(addDays(endOfWeek(selected, WEEK), 1)) };
    return {
      from: startOfWeek(startOfMonth(selected), WEEK),
      to: startOfDay(addDays(endOfWeek(endOfMonth(selected), WEEK), 1)),
    };
  }, [view, selected]);
  const days = useMemo(() => {
    const list: Date[] = [];
    for (let d = range.from; d < range.to; d = addDays(d, 1)) list.push(d);
    return list;
  }, [range]);

  const { data: events, isLoading } = useEvents(range.from, range.to);
  const dayEvents = eventsOn(events, selected);

  const shift = (dir: 1 | -1) => {
    tap(5);
    setSelected((d) => (view === "week" ? addWeeks(d, dir) : startOfMonth(addMonths(d, dir))));
  };
  const swipe = useSwipe(() => shift(1), () => shift(-1));
  const onToday = isToday(selected);

  const addOnDay = () => {
    const start = new Date(selected);
    start.setHours(20, 0, 0, 0);
    openEvent({ startAt: start.toISOString(), forWhom: "both" });
  };

  return (
    <>
      <PageHeader
        subtitle={fmt(selected, "MMMM yyyy")}
        title="Agenda"
        right={
          !onToday && (
            <Button size="sm" variant="soft" onClick={() => setSelected(startOfDay(new Date()))}>
              Aujourd'hui
            </Button>
          )
        }
      />

      <div className="px-4">
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "h-9 rounded-xl text-caption font-semibold text-ink-3",
                view === v && "bg-surface text-ink shadow-card",
              )}
            >
              {v === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>

        <div {...swipe} className="touch-pan-y">
          {view === "week" ? (
            <div key={range.from.toISOString()} className="animate-rise grid grid-cols-7 gap-1">
              {days.map((d) => {
                const isSel = isSameDay(d, selected);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelected(d)}
                    className={cn(
                      "pressable flex flex-col items-center gap-1 rounded-2xl py-2",
                      isSel ? "bg-ink text-bg" : isToday(d) ? "text-violet" : "text-ink",
                    )}
                  >
                    <span className={cn("text-[11px] font-semibold uppercase", !isSel && "text-ink-3")}>{fmt(d, "EEEEE")}</span>
                    <span className="font-display text-title font-bold">{fmt(d, "d")}</span>
                    <DayDots events={eventsOn(events, d)} members={members} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div key={range.from.toISOString()} className="animate-rise">
              <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-semibold text-ink-3 uppercase">
                {days.slice(0, 7).map((d) => <span key={d.toISOString()}>{fmt(d, "EEEEE")}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {days.map((d) => {
                  const isSel = isSameDay(d, selected);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setSelected(d)}
                      className={cn(
                        "flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl",
                        isSel && "bg-ink text-bg",
                        !isSel && isToday(d) && "text-violet",
                        !isSameMonth(d, selected) && !isSel && "opacity-35",
                      )}
                    >
                      <span className="font-semibold">{fmt(d, "d")}</span>
                      <DayDots events={eventsOn(events, d)} members={members} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFreeOpen(true)}
          className="pressable mt-4 flex w-full items-center gap-3 rounded-2xl bg-gradient-noo-soft p-3 text-left"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-surface text-violet shadow-card">
            <CalendarHeart className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">On est libres quand ?</span>
            <span className="text-caption text-ink-3">Vos soirées et week-ends sans rien</span>
          </span>
          <ChevronRight className="size-5 text-ink-3" />
        </button>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-title font-bold first-letter:uppercase">{dayLabel(selected)}</h2>
            <Button size="icon-sm" variant="soft" aria-label="Ajouter ce jour-là" onClick={addOnDay}>
              <Plus className="size-4" />
            </Button>
          </div>
          {isLoading && !events ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : dayEvents.length ? (
            <ul className="space-y-2">
              {dayEvents.map((e) => (
                <li key={e.id} className="animate-rise">
                  <EventRow event={e} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              emoji="🌿"
              title="Rien de prévu"
              action={<Button variant="secondary" size="sm" onClick={addOnDay}>Planifier quelque chose</Button>}
            />
          )}
        </section>
      </div>

      <FreeSlotsSheet open={freeOpen} onOpenChange={setFreeOpen} />
    </>
  );
}
