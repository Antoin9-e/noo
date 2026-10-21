import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/common/Logo";
import { Avatar } from "@/components/common/Avatar";
import { toneOf } from "@/lib/person-color";
import { firstName } from "@/lib/dates";
import type { PersonColor } from "@/types";
import { ColorPicker } from "./ColorPicker";
import { InvitePanel } from "./InvitePanel";
import { useCreateFamily, useMe } from "./hooks";

export default function OnboardingPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const create = useCreateFamily();
  const [name, setName] = useState("Chez nous");
  const [color, setColor] = useState<PersonColor>("VIOLET");
  const [familyId, setFamilyId] = useState<string | null>(null);

  if (!me) return <div className="min-h-dvh" />;
  // Déjà dans un foyer (et pas en train de finir l'onboarding) : rien à faire ici
  if (me.memberships.length > 0 && !familyId) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const family = await create.mutateAsync({ name: name.trim() || "Chez nous", color });
      setFamilyId(family.id);
    } catch {
      toast.error("Impossible de créer le foyer, réessaie.");
    }
  };

  return (
    <div className="pt-safe mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
      {!familyId ? (
        <form onSubmit={submit} className="flex flex-1 flex-col">
          <div className="animate-rise flex-1 pt-10">
            <Logo className="size-14" />
            <h1 className="mt-6 text-display font-bold">Créez votre petit monde</h1>
            <p className="mt-2 text-ink-2">
              Un foyer, c'est votre espace à deux : agenda, envies, soirées.
            </p>

            <label htmlFor="family-name" className="mt-8 mb-2 block text-caption font-semibold text-ink-2">
              Son nom
            </label>
            <Input id="family-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />

            <p className="mt-8 mb-2 text-caption font-semibold text-ink-2">Ta couleur</p>
            <ColorPicker value={color} onChange={setColor} />
            <p className="mt-3 text-caption text-ink-3">
              L'autre aura l'autre couleur, et tout ce que vous faites ensemble sera en{" "}
              <span className="font-semibold text-gradient-noo">dégradé</span>.
            </p>
          </div>
          <Button type="submit" variant="gradient" size="lg" className="mt-8 w-full" disabled={create.isPending}>
            {create.isPending ? "Création…" : "C'est parti"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="animate-rise flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex items-center">
              <Avatar name={me.name} image={me.image} tone={toneOf(color)} size="lg" />
              <span className="-ml-6 grid size-[100px] place-items-center rounded-full border-2 border-dashed border-ink/20 bg-bg font-display text-display text-ink-3">
                ?
              </span>
            </div>
            <h1 className="mt-8 text-display font-bold">Invite ta moitié</h1>
            <p className="mt-2 max-w-[32ch] text-ink-2">
              Envoie-lui le lien par WhatsApp ou SMS. Dès qu'elle ou il rejoint, vous partagez tout.
            </p>
          </div>
          <InvitePanel familyId={familyId} familyName={name} inviterName={firstName(me.name)} />
          <Button variant="ghost" className="mt-2 w-full" onClick={() => navigate("/", { replace: true })}>
            Plus tard
          </Button>
        </div>
      )}
    </div>
  );
}
