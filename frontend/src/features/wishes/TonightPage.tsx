import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Dices, PartyPopper, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/features/household/hooks";
import { useSaveEvent } from "@/features/agenda/hooks";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Wish, WishCategory } from "@/types";
import { categoryByKey, TONIGHT_CATEGORIES } from "./categories";
import { useWishes } from "./hooks";
import { openMatches } from "./selectors";
import { WishImage } from "./WishImage";

type Choice = WishCategory | "SURPRISE";

const CHOICES: Array<{ key: Choice; label: string; emoji: string }> = [
  ...TONIGHT_CATEGORIES.map((k) => ({ key: k as Choice, label: categoryByKey[k].singular, emoji: categoryByKey[k].emoji })),
  { key: "SURPRISE", label: "Surprise", emoji: "🎲" },
];

function pickOther(pool: Wish[], current?: Wish) {
  const others = pool.length > 1 ? pool.filter((w) => w.id !== current?.id) : pool;
  return others[Math.floor(Math.random() * others.length)]!;
}

// Tirage façon machine à sous parmi vos matchs
export default function TonightPage() {
  const navigate = useNavigate();
  const { data: wishes } = useWishes();
  const { me, partner } = useHousehold();
  const save = useSaveEvent();
  const [choice, setChoice] = useState<Choice>("SURPRISE");
  const [shown, setShown] = useState<Wish | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timers = useRef<number[]>([]);

  const pool = useMemo(() => {
    const matches = wishes ? openMatches(wishes).filter((w) => w.category !== "GIFT") : [];
    return choice === "SURPRISE" ? matches : matches.filter((w) => w.category === choice);
  }, [wishes, choice]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const spin = () => {
    if (!pool.length) return;
    timers.current.forEach(clearTimeout);
    setSpinning(true);
    let t = 0;
    let current = shown ?? undefined;
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      t += 50 + i * i * 2.4; // ralentit progressivement
      const last = i === steps - 1;
      timers.current.push(
        window.setTimeout(() => {
          current = pickOther(pool, current);
          setShown(current);
          tap(last ? [15, 40, 25] : 4);
          if (last) setSpinning(false);
        }, t),
      );
    }
  };

  const doIt = () => {
    if (!shown || !me) return;
    const meta = categoryByKey[shown.category];
    const start = new Date();
    start.setHours(20, 30, 0, 0);
    if (start < new Date()) start.setTime(Date.now() + 15 * 60_000);
    save.mutate({
      title: `${meta.emoji} ${shown.title}`,
      startAt: start.toISOString(),
      endAt: null,
      allDay: false,
      location: null,
      note: null,
      isCountdown: false,
      participantIds: partner ? [me.id, partner.user.id] : [me.id],
    });
    toast.success("C'est noté pour ce soir ✨");
    navigate("/");
  };

  return (
    <div className="flex min-h-[calc(100dvh-env(safe-area-inset-bottom)-96px)] flex-col">
      <header className="pt-safe flex items-center gap-2 px-4 pb-3">
        <Button variant="ghost" size="icon" aria-label="Retour" onClick={() => navigate(-1)} className="-ml-2">
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="flex-1 text-title font-bold">Ce soir on fait quoi ?</h1>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4">
        {CHOICES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setChoice(c.key);
              setShown(null);
            }}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-caption font-semibold",
              choice === c.key ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card",
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {pool.length === 0 ? (
          <EmptyState
            emoji="💞"
            title="Pas encore de match ici"
            action={<Button variant="gradient" onClick={() => navigate("/envies/match")}>Aller matcher</Button>}
          >
            Le tirage se fait parmi les envies que vous voulez tous les deux.
          </EmptyState>
        ) : shown ? (
          <div key={spinning ? shown.id : `final-${shown.id}`} className={cn("flex flex-col items-center text-center", !spinning && "animate-pop")}>
            <div className={cn("rounded-[30px] p-1", !spinning && "bg-gradient-noo shadow-float")}>
              <WishImage
                wish={shown}
                className="h-72 w-48 rounded-[26px]"
                emojiSize="text-[72px]"
              />
            </div>
            <p className="mt-5 text-caption font-semibold text-ink-3">
              {categoryByKey[shown.category].emoji} {categoryByKey[shown.category].singular}
            </p>
            <p className="max-w-[24ch] font-display text-display font-bold">{shown.title}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="grid h-72 w-48 place-items-center rounded-[30px] border-2 border-dashed border-ink/15 bg-gradient-noo-soft">
              <Dices className="size-16 text-violet" />
            </div>
            <p className="mt-5 max-w-[26ch] text-ink-2">
              {pool.length} match{pool.length > 1 ? "s" : ""} dans le chapeau. Laissez le hasard choisir !
            </p>
          </div>
        )}
      </div>

      {pool.length > 0 && (
        <div className="space-y-3 px-4 pt-6 pb-4">
          {shown && !spinning ? (
            <>
              <Button variant="gradient" size="lg" className="w-full" onClick={doIt}>
                <PartyPopper /> On fait ça !
              </Button>
              <Button variant="secondary" className="w-full" onClick={spin}>
                <RotateCcw /> Un autre
              </Button>
            </>
          ) : (
            <Button variant="gradient" size="lg" className="w-full" onClick={spin} disabled={spinning}>
              <Dices /> {spinning ? "Ça tourne…" : "Tirer au sort"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
