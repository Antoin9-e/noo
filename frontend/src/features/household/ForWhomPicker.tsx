import { Avatar } from "@/components/common/Avatar";
import { cn } from "@/lib/utils";
import { tap } from "@/lib/haptics";
import { firstName } from "@/lib/dates";
import { toneOf } from "@/lib/person-color";
import { useHousehold } from "./hooks";

export type ForWhom = "me" | "partner" | "both";

const RING = { violet: "ring-violet", orange: "ring-orange", both: "ring-violet", none: "ring-ink" };

// « Pour qui ? » : Moi / l'autre / Nous deux, en gros boutons colorés
export function ForWhomPicker({ value, onChange }: { value: ForWhom; onChange: (v: ForWhom) => void }) {
  const { me, mine, partner } = useHousehold();
  if (!me || !mine) return null;

  const options: Array<{ value: ForWhom; label: string; tone: "violet" | "orange" | "both" | "none"; avatar: React.ReactNode }> = [
    {
      value: "me",
      label: "Moi",
      tone: toneOf(mine.color),
      avatar: <Avatar name={me.name} image={me.image} tone={toneOf(mine.color)} size="sm" />,
    },
  ];
  if (partner) {
    options.push(
      {
        value: "partner",
        label: firstName(partner.user.name),
        tone: toneOf(partner.color),
        avatar: <Avatar name={partner.user.name} image={partner.user.image} tone={toneOf(partner.color)} size="sm" />,
      },
      {
        value: "both",
        label: "Nous deux",
        tone: "both",
        avatar: (
          <span className="flex -space-x-3">
            <Avatar name={me.name} image={me.image} tone={toneOf(mine.color)} size="sm" />
            <Avatar name={partner.user.name} image={partner.user.image} tone={toneOf(partner.color)} size="sm" />
          </span>
        ),
      },
    );
  }

  return (
    <div className={cn("grid gap-2", options.length === 3 ? "grid-cols-3" : "grid-cols-1")}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              tap();
              onChange(o.value);
            }}
            className={cn(
              "pressable flex flex-col items-center gap-2 rounded-2xl bg-surface px-2 py-3 shadow-card ring-2 ring-transparent",
              selected && RING[o.tone],
              selected && o.tone === "both" && "bg-gradient-noo-soft",
            )}
          >
            {o.avatar}
            <span className="max-w-full truncate text-caption font-semibold">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function participantsFor(forWhom: ForWhom, meId: string, partnerId?: string) {
  if (forWhom === "me" || !partnerId) return [meId];
  if (forWhom === "partner") return [partnerId];
  return [meId, partnerId];
}

export function forWhomOf(participantIds: string[], meId: string, partnerId?: string): ForWhom {
  if (!partnerId) return "me";
  const hasMe = participantIds.includes(meId);
  const hasPartner = participantIds.includes(partnerId);
  if (hasMe && hasPartner) return "both";
  return hasPartner ? "partner" : "me";
}
