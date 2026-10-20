import { PersonDot } from "@/components/common/PersonDot";
import { toneFor } from "@/lib/person-color";
import type { Member, NooEvent } from "@/types";

export function DayDots({ events, members }: { events: NooEvent[]; members: Member[] }) {
  return (
    <span className="flex h-2 items-center justify-center gap-0.5">
      {events.slice(0, 3).map((e) => (
        <PersonDot key={e.id} tone={toneFor(e.participantIds, members)} className="size-1.5" />
      ))}
    </span>
  );
}
