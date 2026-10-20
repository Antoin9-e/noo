import { MapPin } from "lucide-react";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { TONE_BG, toneFor } from "@/lib/person-color";
import { fmt, timeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { NooEvent } from "@/types";

// Barre de couleur à gauche : qui est concerné (violet, orange ou dégradé)
export function EventRow({ event, showDay = false }: { event: NooEvent; showDay?: boolean }) {
  const { members } = useHousehold();
  const openEvent = useUi((s) => s.openEvent);
  const tone = toneFor(event.participantIds, members);
  const pending = event.id.startsWith("temp-");

  return (
    <button
      type="button"
      onClick={() => !pending && openEvent(event)}
      className={cn(
        "pressable flex w-full items-stretch gap-3 rounded-2xl bg-surface p-3 text-left shadow-card",
        pending && "opacity-60",
      )}
    >
      <span className={cn("w-1.5 shrink-0 rounded-full", TONE_BG[tone])} />
      <span className="min-w-0 flex-1 py-0.5">
        <span className="block truncate font-semibold">{event.title}</span>
        <span className="flex items-center gap-2 text-caption text-ink-3">
          {showDay && <span className="first-letter:uppercase">{fmt(event.startAt, "EEE d")} ·</span>}
          {timeRange(event)}
          {event.location && (
            <span className="flex min-w-0 items-center gap-1 truncate">
              · <MapPin className="size-3 shrink-0" /> <span className="truncate">{event.location}</span>
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
