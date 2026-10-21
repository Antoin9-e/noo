import { useMemo } from "react";
import { Link } from "react-router-dom";
import { addDays, isSameDay, startOfDay } from "date-fns";
import { ChevronRight, Flame, Mail, Moon, Music2, PenLine } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { Avatar } from "@/components/common/Avatar";
import { useHousehold } from "@/features/household/hooks";
import { useCountdowns, useEvents } from "@/features/agenda/hooks";
import { EventRow } from "@/features/agenda/EventRow";
import { useWishes } from "@/features/wishes/hooks";
import { openMatches, toSwipe } from "@/features/wishes/selectors";
import { useActivity } from "@/features/activity/hooks";
import { ActivityItem } from "@/features/activity/ActivityItem";
import { useUnreadNotes } from "@/features/notes/hooks";
import { useUi } from "@/stores/ui";
import { countdownLabel, firstName, fmt, greeting } from "@/lib/dates";
import { TONE_SOFT, toneFor, toneOf } from "@/lib/person-color";
import { cn } from "@/lib/utils";
import type { NooEvent } from "@/types";

const FEED_WINDOW = 48 * 3600_000;

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-title font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Countdowns({ events }: { events: NooEvent[] }) {
  const { members } = useHousehold();
  return (
    <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
      {events.map((e) => {
        const tone = toneFor(e.participantIds, members);
        const both = tone === "both";
        return (
          <div
            key={e.id}
            className={cn(
              "flex w-40 shrink-0 snap-start flex-col justify-between gap-4 rounded-3xl p-4",
              both ? "bg-gradient-noo text-white shadow-float" : cn(TONE_SOFT[tone], "text-ink"),
            )}
          >
            <span className="font-display text-display font-bold">{countdownLabel(new Date(e.startAt))}</span>
            <span>
              <span className="block truncate font-semibold">{e.title}</span>
              <span className={cn("text-caption", both ? "text-white/80" : "text-ink-3")}>{fmt(e.startAt, "d MMMM")}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Le dernier mot de l'autre pas encore lu, mis en avant comme un post-it
function UnreadNote() {
  const { partner } = useHousehold();
  const unread = useUnreadNotes();
  const note = unread[0];
  if (!note || !partner) return null;
  const music = note.musicTitle && `${note.musicTitle}${note.musicArtist ? ` · ${note.musicArtist}` : ""}`;
  return (
    <Link to="/mots" className="pressable animate-rise mt-6 flex items-center gap-3 rounded-3xl bg-gradient-noo-soft p-4 shadow-card">
      <Avatar name={partner.user.name} image={partner.user.image} tone={toneOf(partner.color)} />
      <span className="min-w-0 flex-1">
        <span className="block text-caption font-semibold text-ink-3">
          {note.text ? `Un mot de ${firstName(partner.user.name)}` : `${firstName(partner.user.name)} t'a partagé une musique`}
          {unread.length > 1 && ` · +${unread.length - 1}`}
        </span>
        {note.text && <span className="line-clamp-2 font-semibold">{note.text}</span>}
        {note.spotifyId && (
          <span className="flex items-center gap-1 truncate text-caption text-ink-2">
            <Music2 className="size-3.5 shrink-0" /> {music ?? "Une musique Spotify"}
          </span>
        )}
      </span>
      {note.musicImage ? (
        <img src={note.musicImage} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <ChevronRight className="size-5 text-ink-3" />
      )}
    </Link>
  );
}

export default function TodayPage() {
  const { me, mine, partner } = useHousehold();
  const today = useMemo(() => startOfDay(new Date()), []);
  const { data: events, isLoading: eventsLoading } = useEvents(today, addDays(today, 2));
  const { data: countdowns } = useCountdowns();
  const { data: wishes } = useWishes();
  const { data: activity } = useActivity();
  const unreadNotes = useUnreadNotes();
  const openNote = useUi((s) => s.openNote);

  const now = new Date();
  const todayEvents = events?.filter((e) => isSameDay(new Date(e.startAt), today) || (e.endAt && new Date(e.endAt) >= today && new Date(e.startAt) < today)) ?? [];
  const tomorrowEvents = events?.filter((e) => isSameDay(new Date(e.startAt), addDays(today, 1))) ?? [];

  // « Vous êtes libres ce soir » : personne n'a rien après 19h, et il y a des matchs à tirer
  const eveningStart = new Date(today);
  eveningStart.setHours(19);
  const busyTonight = todayEvents.some((e) => e.allDay || new Date(e.endAt ?? e.startAt) >= eveningStart);
  const matches = wishes ? openMatches(wishes).filter((w) => w.category !== "GIFT") : [];
  const showTonight = !!events && !busyTonight && matches.length > 0 && now.getHours() < 23;

  const pending = wishes ? toSwipe(wishes) : [];
  const feed = (activity ?? [])
    .filter((a) => (a.actorId !== me?.id || a.type === "wish.matched") && now.getTime() - new Date(a.createdAt).getTime() < FEED_WINDOW)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        subtitle={fmt(now, "EEEE d MMMM")}
        title={`${greeting()}${me ? ` ${firstName(me.name)}` : ""}`}
        right={
          me && (
            <div className="flex items-center gap-2">
              <Link to="/mots" aria-label="Nos mots" className="pressable relative grid size-11 place-items-center rounded-full bg-surface text-ink-2 shadow-card">
                <Mail className="size-5" />
                {unreadNotes.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-gradient-noo text-[11px] font-bold text-white ring-2 ring-bg">
                    {unreadNotes.length}
                  </span>
                )}
              </Link>
              <Link to="/moi" aria-label="Mon profil" className="pressable">
                <Avatar name={me.name} image={me.image} tone={toneOf(mine?.color)} />
              </Link>
            </div>
          )
        }
      />

      <div className="px-4">
        {countdowns && countdowns.length > 0 && <Countdowns events={countdowns} />}

        <UnreadNote />

        {showTonight && (
          <Link
            to="/ce-soir"
            className="pressable animate-rise mt-6 flex items-center gap-4 rounded-3xl bg-[#1c1131] p-4 text-white shadow-card"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-noo">
              <Moon className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Vous êtes libres ce soir 🌙</span>
              <span className="text-caption text-white/70">Ce soir on fait quoi ? {matches.length} match{matches.length > 1 ? "s" : ""} au choix</span>
            </span>
            <ChevronRight className="size-5 text-white/60" />
          </Link>
        )}

        {pending.length > 0 && (
          <Link
            to="/envies/match"
            className="pressable animate-rise mt-3 flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-card"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-soft text-orange">
              <Flame className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">
                {pending.length} envie{pending.length > 1 ? "s" : ""} {partner ? `de ${firstName(partner.user.name)} ` : ""}à swiper
              </span>
              <span className="text-caption text-ink-3">Dis oui, et c'est peut-être un match</span>
            </span>
            <ChevronRight className="size-5 text-ink-3" />
          </Link>
        )}

        <Section title="Aujourd'hui">
          {eventsLoading && !events ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : todayEvents.length ? (
            <ul className="space-y-2">
              {todayEvents.map((e) => (
                <li key={e.id}><EventRow event={e} /></li>
              ))}
            </ul>
          ) : (
            <EmptyState emoji="🌤️" title="Rien de prévu aujourd'hui">
              Touche + pour ajouter un moment à deux.
            </EmptyState>
          )}
        </Section>

        {tomorrowEvents.length > 0 && (
          <Section title="Demain">
            <ul className="space-y-2">
              {tomorrowEvents.map((e) => (
                <li key={e.id}><EventRow event={e} /></li>
              ))}
            </ul>
          </Section>
        )}

        {partner && (
          <Section
            title={`Du côté de ${firstName(partner.user.name)}`}
            action={
              <button type="button" onClick={() => openNote()} className="pressable flex h-11 items-center gap-1.5 text-caption font-semibold text-violet">
                <PenLine className="size-4" /> Un mot
              </button>
            }
          >
            {feed.length ? (
              <ul className="space-y-2">
                {feed.map((a) => <ActivityItem key={a.id} activity={a} />)}
              </ul>
            ) : (
              <p className="rounded-2xl bg-surface-2 px-4 py-3 text-ink-3">Calme plat depuis 2 jours. Et si tu lui proposais une envie ?</p>
            )}
          </Section>
        )}
      </div>
    </>
  );
}
