import { useEffect, useRef, useState } from "react";
import { ChevronDown, Link2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/common/Sheet";
import { Skeleton } from "@/components/common/Skeleton";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUi, type AddKind } from "@/stores/ui";
import { usePreferences } from "@/stores/preferences";
import { useHousehold } from "@/features/household/hooks";
import { CATEGORIES, categoryByKey } from "@/features/wishes/categories";
import { isSearchDisabled, useCreateWish, useMovieSearch, type WishInput } from "@/features/wishes/hooks";
import { useDebounced } from "@/lib/useDebounced";
import { firstName } from "@/lib/dates";
import { toneOf } from "@/lib/person-color";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { MovieResult } from "@/types";

const KINDS: Array<{ kind: AddKind; label: string; emoji: string }> = [
  { kind: "EVENT", label: "Événement", emoji: "📅" },
  ...CATEGORIES.map((c) => ({ kind: c.key as AddKind, label: c.singular, emoji: c.emoji })),
];

const PLACEHOLDER: Record<AddKind, string> = {
  EVENT: "Resto vendredi, ciné samedi…",
  ...Object.fromEntries(CATEGORIES.map((c) => [c.key, c.placeholder])),
} as Record<AddKind, string>;

// Un champ, des puces de type, Entrée = ajouté. Les détails se règlent ensuite sur la fiche.
export function AddSheet() {
  const draft = useUi((s) => s.addDraft);
  const close = useUi((s) => s.closeAdd);
  const openEvent = useUi((s) => s.openEvent);
  const setLastKind = usePreferences((s) => s.setLastAddKind);
  const { me, partner } = useHousehold();
  const create = useCreateWish();

  const [kind, setKind] = useState<AddKind>("EVENT");
  const [title, setTitle] = useState("");
  const [more, setMore] = useState(false);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [forUserId, setForUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!draft) return;
    setKind(draft.kind);
    setTitle(draft.title ?? "");
    setMore(false);
    setUrl("");
    setNote("");
    setForUserId(partner?.user.id ?? null);
  }, [draft, partner?.user.id]);

  const isMovie = kind === "MOVIE" || kind === "SERIES";
  const query = useDebounced(title, 300);
  const search = useMovieSearch(isMovie ? query : "");
  const searchOff = isSearchDisabled(search.error);
  const results = (search.data ?? []).filter((r) => r.category === kind).concat(
    (search.data ?? []).filter((r) => r.category !== kind),
  );

  const chooseKind = (k: AddKind) => {
    tap(5);
    setKind(k);
    setLastKind(k);
    inputRef.current?.focus();
  };

  const add = (input: WishInput) => {
    create.mutate(input);
    setLastKind(input.category);
    tap(15);
    const meta = categoryByKey[input.category];
    toast.success(`${meta.emoji} Ajouté ${meta.addedTo}`);
    close();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    if (kind === "EVENT") {
      setLastKind("EVENT");
      close();
      openEvent({ title: t, forWhom: "both" });
      return;
    }
    add({
      category: kind,
      title: t,
      url: url.trim() || null,
      note: note.trim() || null,
      forUserId: kind === "GIFT" ? forUserId : null,
    });
  };

  const addMovie = (r: MovieResult) =>
    add({ category: r.category, title: r.title, year: r.year, imageUrl: r.imageUrl, externalId: r.externalId, note: null });

  return (
    <Sheet open={!!draft} onOpenChange={(o) => !o && close()} title="Ajouter">
      <div className="no-scrollbar -mx-6 mb-4 flex gap-2 overflow-x-auto px-6">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            onClick={() => chooseKind(k.kind)}
            className={cn(
              "pressable flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-caption font-semibold",
              kind === k.kind ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card",
            )}
          >
            <span className="text-[16px]">{k.emoji}</span> {k.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4 pb-2">
        <div className="relative">
          {isMovie && <Search className="absolute top-4 left-4 size-5 text-ink-3" />}
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={PLACEHOLDER[kind]}
            autoFocus
            enterKeyHint={kind === "EVENT" ? "next" : "done"}
            maxLength={160}
            aria-label="Titre"
            className={cn("h-14 text-title font-semibold", isMovie && "pl-12")}
          />
        </div>

        {isMovie && title.trim().length >= 2 && !searchOff && (
          <ul className="space-y-2">
            {search.isLoading && !search.data
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)
              : results.map((r) => (
                  <li key={r.externalId}>
                    <button
                      type="button"
                      onClick={() => addMovie(r)}
                      className="pressable flex w-full items-center gap-3 rounded-2xl bg-surface p-2 pr-3 text-left shadow-card"
                    >
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt="" className="h-16 w-11 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-16 w-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-[20px]">
                          {categoryByKey[r.category].emoji}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{r.title}</span>
                        <span className="text-caption text-ink-3">
                          {categoryByKey[r.category].singular}
                          {r.year ? ` · ${r.year}` : ""}
                        </span>
                      </span>
                      <Plus className="size-5 shrink-0 text-violet" />
                    </button>
                  </li>
                ))}
          </ul>
        )}

        {kind === "GIFT" && (
          <div>
            <p className="mb-2 text-caption font-semibold text-ink-2">Pour qui ? 🤫 La personne ne le verra pas.</p>
            <div className="flex gap-2">
              {partner && (
                <button
                  type="button"
                  onClick={() => setForUserId(partner.user.id)}
                  className={cn(
                    "pressable flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-surface font-semibold shadow-card ring-2 ring-transparent",
                    forUserId === partner.user.id && "ring-orange",
                  )}
                >
                  <Avatar name={partner.user.name} image={partner.user.image} tone={toneOf(partner.color)} size="xs" />
                  {firstName(partner.user.name)}
                </button>
              )}
              <button
                type="button"
                onClick={() => setForUserId(null)}
                className={cn(
                  "pressable h-12 flex-1 rounded-2xl bg-surface font-semibold shadow-card ring-2 ring-transparent",
                  forUserId === null && "ring-violet",
                )}
              >
                Quelqu'un d'autre
              </button>
            </div>
          </div>
        )}

        {kind !== "EVENT" && !isMovie && (
          <>
            <button type="button" onClick={() => setMore((m) => !m)} className="flex items-center gap-1 text-caption font-semibold text-violet">
              Lien, note <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} />
            </button>
            {more && (
              <div className="animate-rise space-y-3">
                <div className="relative">
                  <Link2 className="absolute top-3.5 left-4 size-5 text-ink-3" />
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Coller un lien (Google Maps, site…)" inputMode="url" className="pl-11" />
                </div>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Une note" maxLength={2000} />
              </div>
            )}
          </>
        )}

        {(!isMovie || searchOff || (title.trim().length >= 2 && !search.isLoading)) && (
          <Button
            type="submit"
            variant={isMovie && !searchOff ? "ghost" : "gradient"}
            size={isMovie && !searchOff ? "default" : "lg"}
            className="w-full"
            disabled={!title.trim() || !me}
          >
            {kind === "EVENT"
              ? "Continuer"
              : isMovie && !searchOff
                ? `Ajouter « ${title.trim()} » sans affiche`
                : "Ajouter"}
          </Button>
        )}
      </form>
    </Sheet>
  );
}
