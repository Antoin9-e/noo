import { useState } from "react";
import { ChevronDown, MapPin, Trash2 } from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { Switch } from "@/components/common/Switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUi, type EventDraft } from "@/stores/ui";
import { useHousehold } from "@/features/household/hooks";
import { ForWhomPicker } from "@/features/household/ForWhomPicker";
import { forWhomOf, participantsFor, type ForWhom } from "@/features/household/forWhom";
import { fromInputs, toDateInput, toTimeInput } from "@/lib/dates";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useDeleteEvent, useSaveEvent } from "./hooks";

interface FormState {
  title: string;
  date: string;
  allDay: boolean;
  start: string;
  end: string;
  forWhom: ForWhom;
  location: string;
  note: string;
  isCountdown: boolean;
}

function initialState(draft: EventDraft, meId: string, partnerId?: string): FormState {
  const start = draft.startAt ? new Date(draft.startAt) : nextRoundHour();
  const end = draft.endAt ? new Date(draft.endAt) : null;
  return {
    title: draft.title ?? "",
    date: toDateInput(start),
    allDay: draft.allDay ?? false,
    start: toTimeInput(start),
    end: end ? toTimeInput(end) : "",
    forWhom: draft.forWhom ?? (draft.participantIds ? forWhomOf(draft.participantIds, meId, partnerId) : "both"),
    location: draft.location ?? "",
    note: draft.note ?? "",
    isCountdown: draft.isCountdown ?? false,
  };
}

function nextRoundHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

const label = "mb-2 block text-caption font-semibold text-ink-2";

export function EventSheet() {
  const draft = useUi((s) => s.eventDraft);
  const close = useUi((s) => s.closeEvent);
  const { me, partner } = useHousehold();
  const save = useSaveEvent();
  const remove = useDeleteEvent();
  const [form, setForm] = useState<FormState | null>(null);
  const [more, setMore] = useState(false);
  const [shownDraft, setShownDraft] = useState<EventDraft | null>(null);
  const editing = !!draft?.id;

  // Nouveau brouillon → on repart d'un formulaire propre (sans effet, pas de rendu en cascade)
  if (draft !== shownDraft && me) {
    setShownDraft(draft);
    if (draft) {
      setForm(initialState(draft, me.id, partner?.user.id));
      setMore(!!(draft.location || draft.note || draft.isCountdown));
    }
  }

  if (!me) return null;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !form.title.trim()) return;
    const startAt = fromInputs(form.date, form.allDay ? "00:00" : form.start);
    let endAt: Date | null = null;
    if (!form.allDay && form.end) {
      endAt = fromInputs(form.date, form.end);
      // Fin après minuit : le lendemain
      if (endAt < startAt) endAt.setDate(endAt.getDate() + 1);
    }
    save.mutate({
      id: draft?.id,
      title: form.title.trim(),
      startAt: startAt.toISOString(),
      endAt: endAt?.toISOString() ?? null,
      allDay: form.allDay,
      location: form.location.trim() || null,
      note: form.note.trim() || null,
      isCountdown: form.isCountdown,
      participantIds: participantsFor(form.forWhom, me.id, partner?.user.id),
    });
    tap(15);
    close();
  };

  const destroy = () => {
    if (!draft?.id) return;
    remove.mutate(draft.id);
    close();
  };

  return (
    <Sheet
      open={!!draft}
      onOpenChange={(o) => !o && close()}
      title={editing ? "Modifier" : "Nouvel événement"}
    >
      {form && (
        <form onSubmit={submit} className="space-y-5 pb-2">
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Resto, ciné, dîner chez Paul…"
            autoFocus={!editing}
            maxLength={120}
            aria-label="Titre"
            className="h-14 text-title font-semibold"
          />

          <div>
            <span className={label}>Pour qui ?</span>
            <ForWhomPicker value={form.forWhom} onChange={(v) => set("forWhom", v)} />
          </div>

          <div>
            <span className={label}>Quand ?</span>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required aria-label="Jour" />
              {!form.allDay && (
                <Input type="time" value={form.start} onChange={(e) => set("start", e.target.value)} required aria-label="Heure" className="w-28" />
              )}
            </div>
            {!form.allDay && (
              <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="pl-1 text-caption text-ink-3">Fin (facultatif)</span>
                <Input type="time" value={form.end} onChange={(e) => set("end", e.target.value)} aria-label="Heure de fin" className="w-28" />
              </div>
            )}
            <Switch checked={form.allDay} onChange={(v) => set("allDay", v)} label="Toute la journée" />
          </div>

          <button
            type="button"
            onClick={() => setMore((m) => !m)}
            className="flex items-center gap-1 text-caption font-semibold text-violet"
          >
            Plus d'options <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} />
          </button>

          {more && (
            <div className="animate-rise space-y-3">
              <div className="relative">
                <MapPin className="absolute top-3.5 left-4 size-5 text-ink-3" />
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Lieu" className="pl-11" maxLength={200} />
              </div>
              <textarea
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Une note…"
                rows={3}
                maxLength={2000}
                className="w-full rounded-2xl bg-surface-2 px-4 py-3 outline-none focus-visible:ring-4 focus-visible:ring-violet/15"
              />
              <Switch
                checked={form.isCountdown}
                onChange={(v) => set("isCountdown", v)}
                label="Compte à rebours"
                hint="Affiché en « J-12 » sur Aujourd'hui"
              />
            </div>
          )}

          <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={!form.title.trim()}>
            {editing ? "Enregistrer" : "Ajouter"}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" className="w-full text-danger" onClick={destroy}>
              <Trash2 /> Supprimer
            </Button>
          )}
        </form>
      )}
    </Sheet>
  );
}
