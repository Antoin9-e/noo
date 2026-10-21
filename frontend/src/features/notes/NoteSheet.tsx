import { useState } from "react";
import { ClipboardPaste, Music2, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/common/Sheet";
import { Skeleton } from "@/components/common/Skeleton";
import { Switch } from "@/components/common/Switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUi, type NoteDraft } from "@/stores/ui";
import { useHousehold } from "@/features/household/hooks";
import { useDebounced } from "@/lib/useDebounced";
import { firstName } from "@/lib/dates";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { spotifyUrlIn, useSendNote, useSpotifyPreview } from "./hooks";
import { MusicCard } from "./MusicCard";

const PRESETS = ["Je pense à toi 💜", "Tu me manques 🥺", "Bien rentré·e ?", "Ce soir resto ? 🍽️", "Fier·e de toi ✨", "Bisous 😘"];

export function NoteSheet() {
  const draft = useUi((s) => s.noteDraft);
  const close = useUi((s) => s.closeNote);
  const { partner } = useHousehold();
  const send = useSendNote();

  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [notify, setNotify] = useState(true);

  const [shownDraft, setShownDraft] = useState<NoteDraft | null>(null);
  if (draft !== shownDraft) {
    setShownDraft(draft);
    if (draft) {
      setText(draft.text ?? "");
      setLink(draft.spotifyUrl ?? "");
      setNotify(true);
    }
  }

  const spotifyUrl = spotifyUrlIn(useDebounced(link, 250)) ?? "";
  const preview = useSpotifyPreview(spotifyUrl);
  const linkInvalid = link.trim() !== "" && (!spotifyUrl || preview.isError);
  const name = partner ? firstName(partner.user.name) : "l'autre";

  const paste = async () => {
    try {
      setLink(await navigator.clipboard.readText());
    } catch {
      toast.error("Impossible de lire le presse-papiers, colle le lien à la main");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !spotifyUrl) || linkInvalid) return;
    send.mutate(
      { text: text.trim() || null, spotifyUrl: spotifyUrl || null, notify },
      { onError: (err) => toast.error(err.message) },
    );
    tap(15);
    toast.success(notify ? `💌 Envoyé à ${name}` : `📌 Mot posé pour ${name}`);
    close();
  };

  return (
    <Sheet open={!!draft} onOpenChange={(o) => !o && close()} title={`Un mot pour ${name}`}>
      <form onSubmit={submit} className="space-y-4 pb-2">
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                tap(5);
                setText(p);
              }}
              className={cn(
                "pressable h-10 shrink-0 rounded-full px-4 text-caption font-semibold",
                text === p ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris-lui quelque chose…"
          maxLength={1000}
          rows={3}
          aria-label="Ton mot"
          className="w-full resize-none rounded-2xl border border-transparent bg-surface-2 px-4 py-3 text-base outline-none placeholder:text-ink-3 focus-visible:border-violet focus-visible:bg-surface focus-visible:ring-4 focus-visible:ring-violet/15"
        />

        <div>
          <div className="relative">
            <Music2 className="absolute top-3.5 left-4 size-5 text-ink-3" />
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Lien Spotify (optionnel)"
              inputMode="url"
              aria-label="Lien Spotify"
              className="pr-12 pl-11"
            />
            <button
              type="button"
              aria-label={link ? "Effacer le lien" : "Coller le lien"}
              onClick={() => (link ? setLink("") : paste())}
              className="pressable absolute top-1 right-1 grid size-10 place-items-center rounded-xl text-violet"
            >
              {link ? <X className="size-5" /> : <ClipboardPaste className="size-5" />}
            </button>
          </div>
          {!link && <p className="mt-1.5 text-caption text-ink-3">Dans Spotify : ••• → Partager → Copier le lien</p>}
          {linkInvalid && <p className="mt-1.5 text-caption text-danger">Ce n'est pas un lien Spotify</p>}
          {spotifyUrl && preview.isLoading && <Skeleton className="mt-3 h-[72px]" />}
          {preview.data && !linkInvalid && (
            <MusicCard
              className="animate-rise mt-3"
              type={preview.data.type}
              id={preview.data.id}
              title={preview.data.title}
              artist={preview.data.artist}
              image={preview.data.image}
            />
          )}
        </div>

        <Switch
          checked={notify}
          onChange={setNotify}
          label="Envoyer en notification"
          hint={notify ? `${name} reçoit une notif tout de suite` : `Posé sur son écran Aujourd'hui, sans notif`}
        />

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={(!text.trim() && !spotifyUrl) || linkInvalid || (!!spotifyUrl && preview.isLoading)}
        >
          {notify ? "Envoyer 💌" : "Poser le mot 📌"}
        </Button>
      </form>
    </Sheet>
  );
}
