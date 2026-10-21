import { useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { useInstall } from "./useInstall";
import { IosInstallSheet } from "./IosInstallSheet";

const KEY = "noo-install-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// Proposée sur l'écran Aujourd'hui seulement, jamais en plein milieu d'une action
export function InstallBanner() {
  const install = useInstall();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [iosOpen, setIosOpen] = useState(false);

  if (!install.canInstall || dismissed || pathname !== "/") return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* rien */
    }
  };

  return (
    <>
      <div className="animate-rise fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30 mx-auto flex max-w-md items-center gap-3 rounded-3xl bg-surface p-3 pl-4 shadow-card ring-1 ring-line">
        <Logo className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Installe Noo</p>
          <p className="text-caption text-ink-3">Plein écran, plus rapide, notifications.</p>
        </div>
        <Button
          size="sm"
          variant="gradient"
          onClick={() => (install.canPrompt ? install.prompt() : setIosOpen(true))}
        >
          Installer
        </Button>
        <button type="button" aria-label="Plus tard" onClick={dismiss} className="grid size-9 place-items-center text-ink-3">
          <X className="size-4" />
        </button>
      </div>
      <IosInstallSheet open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}
