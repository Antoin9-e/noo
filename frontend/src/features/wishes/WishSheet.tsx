import { CalendarPlus, Check, ExternalLink, Heart, Star, Trash2, X } from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { firstName, fmt } from "@/lib/dates";
import { toneOf } from "@/lib/person-color";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { categoryByKey } from "./categories";
import { WishImage } from "./WishImage";
import { useDeleteWish, useRate, useUpdateWish, useWishes } from "./hooks";
import { useVoteWithCelebration } from "./useVoteWithCelebration";

function Stars({ value, onChange, readOnly }: { value: number | null; onChange?: (v: number) => void; readOnly?: boolean }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          onClick={() => {
            tap(8);
            onChange?.(n);
          }}
          className={cn("grid size-9 place-items-center", !readOnly && "pressable")}
        >
          <Star className={cn("size-6", value && n <= value ? "fill-[#fbbf24] text-[#fbbf24]" : "text-ink/20")} />
        </button>
      ))}
    </span>
  );
}

export function WishSheet() {
  const wishId = useUi((s) => s.wishId);
  const close = useUi((s) => s.closeWish);
  const openEvent = useUi((s) => s.openEvent);
  const { data: wishes } = useWishes();
  const { me, members } = useHousehold();
  const voteFor = useVoteWithCelebration();
  const update = useUpdateWish();
  const remove = useDeleteWish();
  const rate = useRate();
  const wish = wishes?.find((w) => w.id === wishId);

  if (!me) return null;
  const meta = wish && categoryByKey[wish.category];
  const isGift = wish?.category === "GIFT";
  const recipient = wish?.forUserId ? members.find((m) => m.user.id === wish.forUserId) : null;

  const plan = () => {
    if (!wish) return;
    close();
    const start = new Date();
    start.setHours(20, 30, 0, 0);
    openEvent({ title: `${meta!.emoji} ${wish.title}`, startAt: start.toISOString(), forWhom: "both" });
  };

  return (
    <Sheet open={!!wishId && !!wish} onOpenChange={(o) => !o && close()} title={wish?.title ?? "Envie"}>
      {wish && meta && (
        <div className="space-y-5 pb-2">
          <div className="flex gap-4">
            <WishImage wish={wish} className="h-36 w-24 shrink-0 rounded-2xl shadow-card" emojiSize="text-[36px]" />
            <div className="min-w-0 flex-1 py-1">
              <p className="text-caption font-semibold text-ink-3">
                {meta.emoji} {meta.singular}
                {wish.year ? ` · ${wish.year}` : ""}
              </p>
              {isGift && (
                <p className="mt-2 text-ink-2">
                  Pour {recipient ? firstName(recipient.user.name) : "quelqu'un d'autre"} 🤫
                </p>
              )}
              {wish.note && <p className="mt-2 text-ink-2">{wish.note}</p>}
              {wish.url && (
                <a href={wish.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-semibold text-violet">
                  Ouvrir le lien <ExternalLink className="size-4" />
                </a>
              )}
              {wish.status === "DONE" && wish.doneAt && (
                <p className="mt-2 text-caption text-success">Fait le {fmt(wish.doneAt, "d MMMM")} ✓</p>
              )}
            </div>
          </div>

          {wish.isMatch && wish.status === "OPEN" && (
            <div className="rounded-3xl bg-gradient-noo p-4 text-white shadow-float">
              <p className="flex items-center gap-2 font-display text-title font-bold">
                <Heart className="size-5 fill-current" /> C'est un match !
              </p>
              <p className="text-white/85">Vous en avez envie tous les deux.</p>
              <Button variant="secondary" className="mt-3 w-full" onClick={plan}>
                <CalendarPlus /> Planifier
              </Button>
            </div>
          )}

          {!isGift && (
            <ul className="space-y-2">
              {members.map((m) => {
                const v = wish.votes.find((x) => x.userId === m.user.id);
                const isMe = m.user.id === me.id;
                return (
                  <li key={m.user.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card">
                    <Avatar name={m.user.name} image={m.user.image} tone={toneOf(m.color)} size="sm" />
                    <span className="flex-1 font-medium">{isMe ? "Toi" : firstName(m.user.name)}</span>
                    {wish.status === "DONE" ? (
                      <Stars
                        value={v?.rating ?? null}
                        readOnly={!isMe}
                        onChange={(rating) => rate.mutate({ id: wish.id, rating })}
                      />
                    ) : (
                      <span className={cn("text-caption font-semibold", v?.vote === "YES" ? "text-success" : "text-ink-3")}>
                        {v?.vote === "YES" ? "Partant·e ❤️" : v?.vote === "NO" ? "Bof" : "Pas encore vu"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!isGift && wish.status === "OPEN" && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={wish.myVote === "NO" ? "default" : "secondary"}
                onClick={() => voteFor(wish, "NO")}
              >
                <X /> Bof
              </Button>
              <Button
                variant={wish.myVote === "YES" ? "gradient" : "secondary"}
                onClick={() => voteFor(wish, "YES")}
              >
                <Heart className={cn(wish.myVote === "YES" && "fill-current")} /> Carrément
              </Button>
            </div>
          )}

          {wish.status === "OPEN" ? (
            <Button
              variant="soft"
              className="w-full"
              onClick={() => {
                tap(15);
                update.mutate({ id: wish.id, status: "DONE" });
              }}
            >
              <Check /> {isGift ? "Offert !" : "On l'a fait"}
            </Button>
          ) : (
            <Button variant="ghost" className="w-full" onClick={() => update.mutate({ id: wish.id, status: "OPEN" })}>
              Remettre dans les envies
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full text-danger"
            onClick={() => {
              remove.mutate(wish.id);
              close();
            }}
          >
            <Trash2 /> Supprimer
          </Button>
        </div>
      )}
    </Sheet>
  );
}
