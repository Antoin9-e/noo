import { Share, SquarePlus } from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { Logo } from "@/components/common/Logo";

const STEPS = [
  { icon: Share, text: <>Touche <b>Partager</b> en bas de Safari</> },
  { icon: SquarePlus, text: <>Choisis <b>Sur l'écran d'accueil</b></> },
  { icon: null, text: <>Ouvre <b>Noo</b> depuis ton écran d'accueil ✨</> },
];

export function IosInstallSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Installer Noo sur ton iPhone">
      <ol className="space-y-3 pb-2">
        {STEPS.map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-card">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-soft text-violet">
              {Icon ? <Icon className="size-5" /> : <Logo className="size-7" />}
            </span>
            <span className="text-ink-2">{text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-caption text-ink-3">
        Une fois installée, Noo s'ouvre en plein écran et peut t'envoyer des notifications.
      </p>
    </Sheet>
  );
}
