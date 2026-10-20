import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { Heart } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useHousehold } from "@/features/household/hooks";
import { categoryByKey } from "@/features/wishes/categories";
import { useUi } from "@/stores/ui";
import { firstName, fmt } from "@/lib/dates";
import { toneOf } from "@/lib/person-color";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types";
import { REACTIONS, useReact } from "./hooks";

function Sentence({ activity, actor }: { activity: Activity; actor: string }) {
  const { payload } = activity;
  const title = <b className="font-semibold text-ink">{payload.title}</b>;
  const cat = payload.category ? categoryByKey[payload.category] : null;
  switch (activity.type) {
    case "wish.added":
      return <>{actor} a ajouté {title} {cat?.addedTo ?? "aux envies"}</>;
    case "wish.matched":
      return <>Nouveau match : {title} 💞</>;
    case "wish.done":
      return <>{actor} a coché {title} ✅</>;
    case "event.added":
      return (
        <>
          {actor} a prévu {title}
          {payload.startAt && ` · ${fmt(payload.startAt, payload.allDay ? "EEE d MMM" : "EEE d MMM 'à' HH:mm")}`}
        </>
      );
    case "event.updated":
      return <>{actor} a modifié {title}</>;
  }
}

export function ActivityItem({ activity }: { activity: Activity }) {
  const { me, members } = useHousehold();
  const react = useReact();
  const openWish = useUi((s) => s.openWish);
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const press = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);

  const actor = members.find((m) => m.user.id === activity.actorId);
  const mine = activity.reactions.find((r) => r.userId === me?.id);
  const theirs = activity.reactions.filter((r) => r.userId !== me?.id);
  const isMatch = activity.type === "wish.matched";

  const setReaction = (emoji: string | null) => {
    tap(emoji ? 12 : 5);
    react.mutate({ id: activity.id, emoji });
    setPicking(false);
  };

  // Tap = ❤️ (ou retirer) ; appui long = choisir un emoji
  const pressHandlers = {
    onPointerDown: () => {
      longPressed.current = false;
      press.current = window.setTimeout(() => {
        longPressed.current = true;
        tap(8);
        setPicking(true);
      }, 450);
    },
    onPointerUp: () => window.clearTimeout(press.current),
    onPointerLeave: () => window.clearTimeout(press.current),
    onClick: () => {
      if (longPressed.current) return;
      setReaction(mine ? null : "❤️");
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  const open = () => {
    if (activity.payload.wishId) openWish(activity.payload.wishId);
    else if (activity.payload.eventId) navigate("/agenda");
  };

  return (
    <li className={cn("relative flex items-center gap-3 rounded-2xl p-3", isMatch ? "bg-gradient-noo-soft" : "bg-surface shadow-card")}>
      {actor && !isMatch ? (
        <Avatar name={actor.user.name} image={actor.user.image} tone={toneOf(actor.color)} size="sm" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-noo text-white">
          <Heart className="size-4 fill-current" />
        </span>
      )}
      <button type="button" onClick={open} className="min-w-0 flex-1 text-left">
        <span className="block text-ink-2">
          <Sentence activity={activity} actor={actor ? firstName(actor.user.name) : "Quelqu'un"} />
        </span>
        <span className="text-caption text-ink-3">
          {formatDistanceToNowStrict(new Date(activity.createdAt), { locale: fr, addSuffix: true })}
          {theirs.length > 0 && <span className="ml-2">{theirs.map((r) => r.emoji).join(" ")}</span>}
        </span>
      </button>
      <button
        type="button"
        aria-label={mine ? "Retirer ma réaction" : "Réagir"}
        {...pressHandlers}
        className={cn(
          "pressable grid size-11 shrink-0 place-items-center rounded-full text-[20px] select-none",
          mine ? "animate-pop bg-surface-2" : "text-ink-3",
        )}
      >
        {mine ? mine.emoji : <Heart className="size-5" />}
      </button>

      {picking && (
        <>
          <button type="button" aria-label="Fermer" className="fixed inset-0 z-40 cursor-default" onClick={() => setPicking(false)} />
          <div className="animate-pop absolute -top-12 right-2 z-50 flex gap-1 rounded-full bg-surface p-1.5 shadow-float ring-1 ring-line">
            {REACTIONS.map((e) => (
              <button key={e} type="button" onClick={() => setReaction(e)} className="pressable grid size-9 place-items-center rounded-full text-[20px]">
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </li>
  );
}
