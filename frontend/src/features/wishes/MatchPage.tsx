import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, Plus, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { firstName } from "@/lib/dates";
import { toneOf } from "@/lib/person-color";
import { cn } from "@/lib/utils";
import type { Vote, Wish, WishCategory } from "@/types";
import { CATEGORIES, categoryByKey } from "./categories";
import { useWishes } from "./hooks";
import { toSwipe } from "./selectors";
import { WishImage } from "./WishImage";
import { useVoteWithCelebration } from "./WishSheet";

const THRESHOLD = 100;

function SwipeCard({ wish, onVote }: { wish: Wish; onVote: (v: Vote) => void }) {
  const { members } = useHousehold();
  const [dx, setDx] = useState(0);
  const [fly, setFly] = useState<Vote | null>(null);
  const start = useRef<number | null>(null);
  const author = members.find((m) => m.user.id === wish.createdById);
  const meta = categoryByKey[wish.category];

  const release = (v: Vote) => {
    setFly(v);
    window.setTimeout(() => onVote(v), 220);
  };

  const x = fly ? (fly === "YES" ? 600 : -600) : dx;
  const yesOpacity = Math.min(Math.max(dx / THRESHOLD, 0), 1);
  const noOpacity = Math.min(Math.max(-dx / THRESHOLD, 0), 1);

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      style={{
        transform: `translateX(${x}px) rotate(${x / 18}deg)`,
        transition: start.current === null ? "transform 260ms cubic-bezier(0.22,1,0.36,1)" : "none",
      }}
      onPointerDown={(e) => {
        start.current = e.clientX;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
      onPointerUp={() => {
        start.current = null;
        if (dx > THRESHOLD) release("YES");
        else if (dx < -THRESHOLD) release("NO");
        else setDx(0);
      }}
      onPointerCancel={() => {
        start.current = null;
        setDx(0);
      }}
    >
      <div className="relative size-full overflow-hidden rounded-[32px] bg-surface shadow-card">
        <WishImage wish={wish} className="absolute inset-0 size-full" emojiSize="text-[96px]" emojiClassName="-translate-y-20" />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-5 pt-24",
            wish.imageUrl ? "bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white" : "text-ink",
          )}
        >
          <p className="text-caption font-semibold opacity-80">
            {meta.emoji} {meta.singular}
            {wish.year ? ` · ${wish.year}` : ""}
          </p>
          <p className="font-display text-display leading-tight font-bold">{wish.title}</p>
          {wish.note && <p className="mt-1 line-clamp-2 opacity-85">{wish.note}</p>}
          {author && (
            <p className="mt-3 flex items-center gap-2 text-caption opacity-85">
              <Avatar name={author.user.name} image={author.user.image} tone={toneOf(author.color)} size="xs" />
              Ajouté par {firstName(author.user.name)}
            </p>
          )}
        </div>
        <span
          className="absolute top-8 left-6 -rotate-12 rounded-2xl border-4 border-success px-3 py-1 font-display text-display font-bold text-success"
          style={{ opacity: fly === "YES" ? 1 : yesOpacity }}
        >
          OUI
        </span>
        <span
          className="absolute top-8 right-6 rotate-12 rounded-2xl border-4 border-white px-3 py-1 font-display text-display font-bold text-white"
          style={{ opacity: fly === "NO" ? 1 : noOpacity }}
        >
          BOF
        </span>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const navigate = useNavigate();
  const { data: wishes, isLoading } = useWishes();
  const openAdd = useUi((s) => s.openAdd);
  const voteFor = useVoteWithCelebration();
  const [category, setCategory] = useState<WishCategory | "ALL">("ALL");
  const [, rerender] = useState(0);

  const queue = useMemo(
    () => (wishes ? toSwipe(wishes).filter((w) => category === "ALL" || w.category === category) : []),
    [wishes, category],
  );
  const top = queue[0];
  const next = queue[1];
  const counts = useMemo(() => {
    const all = wishes ? toSwipe(wishes) : [];
    return Object.fromEntries(CATEGORIES.map((c) => [c.key, all.filter((w) => w.category === c.key).length]));
  }, [wishes]);

  const vote = (v: Vote) => {
    if (!top) return;
    voteFor(top, v);
    rerender((n) => n + 1);
  };

  return (
    <div className="flex h-[calc(100dvh-env(safe-area-inset-bottom)-96px)] flex-col">
      <header className="pt-safe flex items-center gap-2 px-4 pb-3">
        <Button variant="ghost" size="icon" aria-label="Retour" onClick={() => navigate("/envies")} className="-ml-2">
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="flex-1 text-title font-bold">Matcher</h1>
        {queue.length > 0 && <span className="text-caption font-semibold text-ink-3">{queue.length} restante{queue.length > 1 ? "s" : ""}</span>}
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4">
        {[{ key: "ALL" as const, label: "Tout", emoji: "✨" }, ...CATEGORIES.filter((c) => c.key !== "GIFT" && counts[c.key])].map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-caption font-semibold",
              category === c.key ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card",
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="relative mx-4 flex-1">
        {isLoading ? (
          <Skeleton className="absolute inset-0 rounded-[32px]" />
        ) : !top ? (
          <div className="grid h-full place-items-center">
            <EmptyState
              emoji="🎉"
              title="Tout est swipé !"
              action={
                <Button variant="gradient" onClick={() => openAdd({ kind: category === "ALL" ? "MOVIE" : category })}>
                  <Plus /> Ajouter des envies
                </Button>
              }
            >
              Ajoute de nouvelles envies : l'autre pourra les matcher à son tour.
            </EmptyState>
          </div>
        ) : (
          <>
            {next && (
              <div className="absolute inset-0 scale-[0.94] translate-y-3 opacity-70 transition-transform">
                <WishImage wish={next} className="size-full rounded-[32px]" emojiSize="text-[96px]" />
              </div>
            )}
            <SwipeCard key={top.id} wish={top} onVote={vote} />
          </>
        )}
      </div>

      {top && (
        <div className="flex items-center justify-center gap-6 py-5">
          <button
            type="button"
            aria-label="Bof"
            onClick={() => vote("NO")}
            className="pressable grid size-16 place-items-center rounded-full bg-surface text-ink-2 shadow-card"
          >
            <X className="size-7" strokeWidth={2.6} />
          </button>
          <button
            type="button"
            aria-label="Carrément"
            onClick={() => vote("YES")}
            className="pressable grid size-20 place-items-center rounded-full bg-gradient-noo text-white shadow-float"
          >
            <Heart className="size-9 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
}
