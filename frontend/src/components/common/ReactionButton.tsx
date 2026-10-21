import { useRef, useState } from "react";
import { Heart } from "lucide-react";
import { REACTIONS } from "@/features/activity/hooks";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// Tap = ❤️ (ou retirer) ; appui long = choisir un emoji
export function ReactionButton({ mine, onChange }: { mine: string | undefined; onChange: (emoji: string | null) => void }) {
  const [picking, setPicking] = useState(false);
  const press = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);

  const setReaction = (emoji: string | null) => {
    tap(emoji ? 12 : 5);
    onChange(emoji);
    setPicking(false);
  };

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        aria-label={mine ? "Retirer ma réaction" : "Réagir"}
        onPointerDown={() => {
          longPressed.current = false;
          press.current = window.setTimeout(() => {
            longPressed.current = true;
            tap(8);
            setPicking(true);
          }, 450);
        }}
        onPointerUp={() => window.clearTimeout(press.current)}
        onPointerLeave={() => window.clearTimeout(press.current)}
        onClick={() => {
          if (longPressed.current) return;
          setReaction(mine ? null : "❤️");
        }}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "pressable grid size-11 place-items-center rounded-full text-[20px] select-none",
          mine ? "animate-pop bg-surface-2" : "text-ink-3",
        )}
      >
        {mine ?? <Heart className="size-5" />}
      </button>

      {picking && (
        <>
          <button type="button" aria-label="Fermer" className="fixed inset-0 z-40 cursor-default" onClick={() => setPicking(false)} />
          <div className="animate-pop absolute -top-12 right-0 z-50 flex gap-1 rounded-full bg-surface p-1.5 shadow-float ring-1 ring-line">
            {REACTIONS.map((e) => (
              <button key={e} type="button" onClick={() => setReaction(e)} className="pressable grid size-9 place-items-center rounded-full text-[20px]">
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
