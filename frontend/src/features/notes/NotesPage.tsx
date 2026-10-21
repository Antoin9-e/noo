import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { BellRing, Check, ChevronLeft, PenLine, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { Avatar } from "@/components/common/Avatar";
import { ReactionButton } from "@/components/common/ReactionButton";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { firstName } from "@/lib/dates";
import { TONE_SOFT, toneOf } from "@/lib/person-color";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Note } from "@/types";
import { useDeleteNote, useMarkNotesRead, useNotes, useReactNote, useUnreadNotes } from "./hooks";
import { MusicCard } from "./MusicCard";

function NoteBubble({ note }: { note: Note }) {
  const { me, members } = useHousehold();
  const remove = useDeleteNote();
  const react = useReactNote();
  const [confirming, setConfirming] = useState(false);

  const author = members.find((m) => m.user.id === note.authorId);
  const isMine = note.authorId === me?.id;
  const tone = toneOf(author?.color);
  const mine = note.reactions.find((r) => r.userId === me?.id);
  const theirs = note.reactions.filter((r) => r.userId !== me?.id);

  return (
    <li className={cn("animate-rise flex items-start gap-2", isMine && "flex-row-reverse")}>
      {author && <Avatar name={author.user.name} image={author.user.image} tone={tone} size="sm" />}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-1", isMine ? "items-end pl-6" : "items-start pr-6")}>
        <div
          className={cn(
            "max-w-full space-y-2 rounded-3xl p-3",
            note.spotifyId && "w-full",
            TONE_SOFT[tone],
            isMine ? "rounded-tr-lg" : "rounded-tl-lg",
          )}
        >
          {note.text && <p className="px-1 break-words whitespace-pre-line">{note.text}</p>}
          {note.spotifyType && note.spotifyId && (
            <MusicCard
              type={note.spotifyType}
              id={note.spotifyId}
              title={note.musicTitle}
              artist={note.musicArtist}
              image={note.musicImage}
            />
          )}
        </div>
        <div className={cn("flex items-center gap-1 px-1 text-caption text-ink-3", isMine && "flex-row-reverse")}>
          <span>{formatDistanceToNowStrict(new Date(note.createdAt), { locale: fr, addSuffix: true })}</span>
          {note.notified && <BellRing className="size-3.5" aria-label="Envoyé en notif" />}
          {isMine && note.readAt && (
            <span className="flex items-center gap-0.5">
              · Vu <Check className="size-3.5" />
            </span>
          )}
          {isMine && theirs.length > 0 && <span className="text-[16px]">{theirs.map((r) => r.emoji).join(" ")}</span>}
          {/* Double tap pour supprimer : pas de suppression par mégarde */}
          <button
            type="button"
            onClick={() => {
              tap(confirming ? 15 : 5);
              if (confirming) remove.mutate(note.id);
              else setConfirming(true);
            }}
            onBlur={() => setConfirming(false)}
            className={cn(
              "pressable flex h-8 items-center gap-1 rounded-full px-2",
              confirming ? "bg-danger/10 font-semibold text-danger" : "text-ink-3",
            )}
          >
            <Trash2 className="size-4" />
            {confirming && "Supprimer ?"}
          </button>
          {!isMine && <ReactionButton mine={mine?.emoji} onChange={(emoji) => react.mutate({ id: note.id, emoji })} />}
        </div>
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
        title="Nos mots 💌"
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
          <ul className="space-y-5">
            {notes.map((n) => <NoteBubble key={n.id} note={n} />)}
          </ul>
        ) : (
          <EmptyState
            emoji="💌"
            title="Pas encore de mot"
            action={<Button variant="gradient" onClick={() => openNote()}>Écrire un mot</Button>}
          >
            Un petit mot doux, ou une musique qui te fait penser à {partner ? firstName(partner.user.name) : "l'autre"}.
          </EmptyState>
        )}
      </div>
    </>
  );
}
