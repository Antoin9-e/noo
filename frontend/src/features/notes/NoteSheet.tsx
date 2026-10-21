import { useState } from "react";
import { ClipboardPaste, Music2, Pin, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/common/Sheet";
import { Skeleton } from "@/components/common/Skeleton";
import { Switch } from "@/components/common/Switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUi, type NoteDraft } from "@/stores/ui";
import { useHousehold } from "@/features/household/hooks";
import { isSearchDisabled } from "@/features/wishes/hooks";
import { useDebounced } from "@/lib/useDebounced";
import { firstName } from "@/lib/dates";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { SpotifyItem } from "@/types";
import { openInSpotify, SPOTIFY_LINK, spotifyUrlIn, useMusicSearch, useSendNote, useSpotifyPreview } from "./hooks";
import { MusicCard } from "./MusicCard";

const PRESETS = ["Je pense à toi", "Tu me manques", "Bien rentré·e ?", "Ce soir, resto ?", "Fier·e de toi", "Bisous"];

export function NoteSheet() {
  const draft = useUi((s) => s.noteDraft);
  const close = useUi((s) => s.closeNote);
  const { partner } = useHousehold();
  const send = useSendNote();

  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [picked, setPicked] = useState<SpotifyItem | null>(null);
  const [notify, setNotify] = useState(true);

  const [shownDraft, setShownDraft] = useState<NoteDraft | null>(null);
  if (draft !== shownDraft) {
    setShownDraft(draft);
    if (draft) {
      setText(draft.text ?? "");
      setLink(draft.spotifyUrl ?? "");
      setPicked(null);
      setNotify(true);
    }
  }

  // Le même champ cherche un titre ou accepte un lien collé
  const typed = useDebounced(link, 250);
  const isLink = /^\s*(https?:|spotify:)/.test(link) || SPOTIFY_LINK.test(typed);
  const linkUrl = isLink ? (spotifyUrlIn(typed) ?? "") : "";
  const preview = useSpotifyPreview(picked ? "" : linkUrl);
  const search = useMusicSearch(picked || isLink ? "" : typed);
  const searchOff = isSearchDisabled(search.error);
  const music = picked ?? (isLink ? preview.data : undefined);
  const spotifyUrl = picked ? openInSpotify(picked.type, picked.id) : linkUrl;
  const linkInvalid = !picked && link.trim() !== "" && (isLink ? !linkUrl || preview.isError : searchOff);
  // Une recherche tapée sans morceau choisi ne doit pas partir en silence
  const unpicked = !picked && !isLink && link.trim() !== "" && !searchOff;
  const results = !picked && !isLink && link.trim().length >= 2 && !searchOff ? search.data : undefined;
  const name = partner ? firstName(partner.user.name) : "l'autre";

  const paste = async () => {
    try {
      setPicked(null);
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
    toast.success(notify ? `Envoyé à ${name}` : `Mot posé pour ${name}`);
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
          {music ? (
            <div className="animate-rise flex items-center gap-2">
              <MusicCard className="min-w-0 flex-1" type={music.type} id={music.id} title={music.title} artist={music.artist} image={music.image} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Retirer la musique"
                onClick={() => {
                  setPicked(null);
                  setLink("");
                }}
              >
                <X />
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                {searchOff ? (
                  <Music2 className="absolute top-3.5 left-4 size-5 text-ink-3" />
                ) : (
                  <Search className="absolute top-3.5 left-4 size-5 text-ink-3" />
                )}
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder={searchOff ? "Lien Spotify (optionnel)" : "Ajouter une musique"}
                  enterKeyHint="search"
                  aria-label="Musique Spotify"
                  className="pr-12 pl-11"
                />
                <button
                  type="button"
                  aria-label={link ? "Effacer" : "Coller un lien"}
                  onClick={() => (link ? setLink("") : paste())}
                  className="pressable absolute top-1 right-1 grid size-10 place-items-center rounded-xl text-violet"
                >
                  {link ? <X className="size-5" /> : <ClipboardPaste className="size-5" />}
                </button>
              </div>
              {!link && (
                <p className="mt-2 px-1 text-caption text-ink-3">
                  {searchOff ? "Dans Spotify : Partager, puis Copier le lien" : "Un titre, un artiste, ou un lien Spotify"}
                </p>
              )}
              {linkInvalid && (
                <p className="mt-2 px-1 text-caption text-danger">
                  {isLink ? "Ce n'est pas un lien Spotify" : "Colle un lien Spotify"}
                </p>
              )}
              {((isLink && linkUrl && preview.isLoading) || (!isLink && link.trim().length >= 2 && search.isLoading && !search.data)) && (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              )}
              {results && results.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {results.slice(0, 6).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          tap(8);
                          setPicked(r);
                        }}
                        className="pressable flex w-full items-center gap-3 rounded-2xl p-2 text-left active:bg-surface-2"
                      >
                        {r.image ? (
                          <img src={r.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface-2">
                            <Music2 className="size-5 text-ink-3" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{r.title}</span>
                          <span className="block truncate text-caption text-ink-3">{r.artist}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {results && results.length === 0 && !search.isFetching && (
                <p className="mt-3 px-1 text-caption text-ink-3">Aucun morceau trouvé</p>
              )}
            </>
          )}
        </div>

        <Switch
          checked={notify}
          onChange={setNotify}
          label="Envoyer en notification"
          hint={notify ? `${name} reçoit une notification tout de suite` : `Il l'attendra sur son écran Aujourd'hui`}
        />

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={(!text.trim() && !spotifyUrl) || linkInvalid || unpicked || (isLink && !!linkUrl && preview.isLoading)}
        >
          {notify ? (
            <>
              <Send /> Envoyer
            </>
          ) : (
            <>
              <Pin /> Poser le mot
            </>
          )}
        </Button>
      </form>
    </Sheet>
  );
}
