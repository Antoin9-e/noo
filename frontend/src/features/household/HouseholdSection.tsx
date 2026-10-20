import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/common/Avatar";
import { Sheet } from "@/components/common/Sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toneOf } from "@/lib/person-color";
import { firstName } from "@/lib/dates";
import type { PersonColor } from "@/types";
import { ColorPicker } from "./ColorPicker";
import { InvitePanel } from "./InvitePanel";
import { useHousehold, useUpdateFamily } from "./hooks";

export function HouseholdSection() {
  const { me, family, members, mine, partner, familyId } = useHousehold();
  const update = useUpdateFamily(familyId);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");

  if (!family || !me || !mine) return null;
  const isAdmin = mine.role === "ADMIN";

  const changeColor = (color: PersonColor) =>
    update.mutate({ color }, { onError: () => toast.error("Impossible de changer la couleur") });

  const rename = async (e: React.FormEvent) => {
    e.preventDefault();
    await update.mutateAsync({ name: name.trim() });
    setRenaming(false);
  };

  return (
    <>
      <div className="rounded-3xl bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="font-display text-title font-bold">{family.name}</p>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Renommer le foyer"
              onClick={() => {
                setName(family.name);
                setRenaming(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
        <ul className="mt-3 space-y-3">
          {members.map((m) => (
            <li key={m.user.id} className="flex items-center gap-3">
              <Avatar name={m.user.name} image={m.user.image} tone={toneOf(m.color)} size="sm" />
              <span className="flex-1 font-medium">
                {m.user.name} {m.user.id === me.id && <span className="text-ink-3">(toi)</span>}
              </span>
              {m.role === "ADMIN" && <span className="text-caption text-ink-3">admin</span>}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 mb-2 px-1 text-caption font-semibold text-ink-2">Ma couleur</p>
      <ColorPicker
        value={mine.color}
        onChange={changeColor}
        takenBy={partner ? { [partner.color]: firstName(partner.user.name) } : undefined}
      />
      {partner && <p className="mt-2 px-1 text-caption text-ink-3">Choisir sa couleur échange avec l'autre.</p>}

      {!partner && (
        <div className="mt-6 rounded-3xl bg-gradient-noo-soft p-4">
          <p className="mb-3 font-semibold">Il manque quelqu'un 👀</p>
          <InvitePanel familyId={family.id} familyName={family.name} inviterName={firstName(me.name)} />
        </div>
      )}

      <Sheet open={renaming} onOpenChange={setRenaming} title="Renommer le foyer">
        <form onSubmit={rename} className="space-y-4 pb-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus />
          <Button type="submit" variant="gradient" className="w-full" disabled={!name.trim() || update.isPending}>
            Enregistrer
          </Button>
        </form>
      </Sheet>
    </>
  );
}
