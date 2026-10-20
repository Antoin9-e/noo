import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { tap } from "@/lib/haptics";
import type { PersonColor } from "@/types";

const OPTIONS: Array<{ value: PersonColor; label: string; swatch: string; ring: string }> = [
  { value: "VIOLET", label: "Violet", swatch: "bg-violet", ring: "ring-violet" },
  { value: "ORANGE", label: "Orange", swatch: "bg-orange", ring: "ring-orange" },
];

export function ColorPicker({ value, onChange, takenBy }: {
  value: PersonColor;
  onChange: (c: PersonColor) => void;
  takenBy?: Partial<Record<PersonColor, string>>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              tap();
              onChange(o.value);
            }}
            className={cn(
              "pressable relative flex flex-col items-start gap-3 rounded-3xl bg-surface p-4 text-left shadow-card ring-2 ring-transparent",
              selected && o.ring,
            )}
            aria-pressed={selected}
          >
            <span className={cn("size-10 rounded-full", o.swatch)} />
            <span>
              <span className="block font-semibold">{o.label}</span>
              {takenBy?.[o.value] && <span className="text-caption text-ink-3">Celle de {takenBy[o.value]}</span>}
            </span>
            {selected && (
              <span className={cn("absolute top-3 right-3 grid size-6 place-items-center rounded-full text-white", o.swatch)}>
                <Check className="size-4" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
