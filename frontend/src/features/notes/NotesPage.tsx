import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isToday, isYesterday } from "date-fns";
import { ChevronLeft, CornerUpLeft, Mail, PenLine, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { Avatar } from "@/components/common/Avatar";
import { ReactionButton } from "@/components/common/ReactionButton";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { firstName, fmt, toDateInput } from "@/lib/dates";
import { TONE_SOFT, toneOf } from "@/lib/person-color";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Note } from "@/types";
import { useDeleteNote, useMarkNotesRead, useNotes, useReactNote, useUnreadNotes } from "./hooks";
import { MusicCard } from "./MusicCard";

function dayTitle(date: Date) {
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  return fmt(date, "EEEE d MMMM");
}

// Les mots du plus récent au plus ancien, regroupés par jour
function byDay(notes: Note[]) {
  const days: Array<{ key: string; title: string; notes: Note[] }> = [];
  for (const note of notes) {
    const date = new Date(note.createdAt);
    const key = toDateInput(date);
    if (days.at(-1)?.key !== key) days.push({ key, title: dayTitle(date), notes: [] });
    days.at(-1)!.notes.push(note);
  }
  return days;
}

interface BubbleProps {
  note: Note;
  selected: boolean;
  onSelect: () => void;
}

// Tap sur la bulle = afficher les actions (répondre, supprimer)
function NoteBubble({ note, selected, onSelect }: BubbleProps) {
  const { me, members, partner } = useHousehold();
  const openNote = useUi((s) => s.openNote);
  const remove = useDeleteNote();
  const react = useReactNote();

  const author = members.find((m) => m.user.id === note.authorId);
  const isMine = note.authorId === me?.id;
  const tone = toneOf(author?.color);
  const mine = note.reactions.find((r) => r.userId === me?.id);
  const theirs = note.reactions.find((r) => r.userId !== me?.id);

  return (
    <li className={cn("animate-rise flex items-start gap-2", isMine && "justify-end pl-12")}>
      {!isMine && author && <Avatar name={author.user.name} image={author.user.image} tone={tone} size="sm" />}

      <div className={cn("flex min-w-0 flex-col", note.spotifyId && "flex-1", isMine ? "items-end" : "items-start")}>
        <div className={cn("flex max-w-full items-center gap-1", note.spotifyId && "w-full")}>
          <div className={cn("relative min-w-0", note.spotifyId && "flex-1")}>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={selected}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a, button")) return;
                tap(5);
                onSelect();
              }}
              className={cn(
                "space-y-2 rounded-3xl p-3 transition-shadow outline-none",
                TONE_SOFT[tone],
                isMine ? "rounded-br-md" : "rounded-bl-md",
                selected && "ring-2 ring-ink/10",
              )}
            >
              {note.text && <p className="px-1 break-words whitespace-pre-line">{note.text}</p>}
              {note.spotifyType && note.spotifyId && (
                <MusicCard type={note.spotifyType} id={note.spotifyId} title={note.musicTitle} artist={note.musicArtist} image={note.musicImage} />
              )}
            </div>
            {/* Réaction de l'autre sur mon mot, en pastille comme une tapback */}
            {isMine && theirs && (
              <span className="animate-pop absolute -bottom-3 left-2 grid size-7 place-items-center rounded-full bg-surface text-[15px] shadow-card ring-2 ring-bg">
                {theirs.emoji}
              </span>
            )}
          </div>
          {!isMine && <ReactionButton mine={mine?.emoji} onChange={(emoji) => react.mutate({ id: note.id, emoji })} />}
        </div>

        <span className={cn("mt-1 px-2 text-caption text-ink-3", isMine && theirs && "mt-3")}>
          {fmt(note.createdAt, "HH:mm")}
          {isMine && note.readAt && " · Vu"}
        </span>

        {selected && (
          <div className="animate-rise mt-1 flex gap-1">
            {!isMine && partner && (
              <Button variant="ghost" size="sm" onClick={() => openNote()}>
                <CornerUpLeft /> Répondre
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={() => {
                tap(15);
                remove.mutate(note.id);
              }}
            >
              <Trash2 /> Supprimer
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function NotesPage() {
  const navigate = useNavigate();
  const { partner } = useHousehold();
  const openNote = useUi((s) => s.openNote);
  const { data: notes, isLoading } = useNotes();
  const unread = useUnreadNotes();
  const { mutate: markRead } = useMarkNotesRead();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Ouvrir la page = avoir vu les mots de l'autre
  const hasUnread = unread.length > 0;
  useEffect(() => {
    if (hasUnread) markRead();
  }, [hasUnread, markRead]);

  return (
    <>
      <PageHeader
        left={
          <Button variant="ghost" size="icon" aria-label="Retour" onClick={() => navigate("/")} className="-ml-2 self-end">
            <ChevronLeft className="size-6" />
          </Button>
        }
        subtitle={partner ? `Toi et ${firstName(partner.user.name)}` : undefined}
        title="Nos mots"
        right={
          <Button variant="gradient" size="icon" aria-label="Écrire un mot" onClick={() => openNote()}>
            <PenLine />
          </Button>
        }
      />
      <div className="px-4">
        {isLoading && !notes ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-3/4" />
            <Skeleton className="ml-auto h-16 w-2/3" />
          </div>
        ) : notes?.length ? (
          <div className="space-y-8">
            {byDay(notes).map((day) => (
              <section key={day.key}>
                <h2 className="mb-4 text-center text-caption font-semibold text-ink-3 first-letter:uppercase">{day.title}</h2>
                <ul className="space-y-4">
                  {day.notes.map((n) => (
                    <NoteBubble
                      key={n.id}
                      note={n}
                      selected={selectedId === n.id}
                      onSelect={() => setSelectedId((id) => (id === n.id ? null : n.id))}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            emoji={<Mail className="size-6 text-violet" />}
            title="Pas encore de mot"
            action={<Button variant="gradient" onClick={() => openNote()}>Écrire un mot</Button>}
          >
            Un petit mot, ou une musique qui te fait penser à {partner ? firstName(partner.user.name) : "l'autre"}.
          </EmptyState>
        )}
      </div>
    </>
  );
}
