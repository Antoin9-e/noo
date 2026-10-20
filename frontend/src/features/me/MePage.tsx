import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Download, LogOut, Moon, Sun, SunMoon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/common/Avatar";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { usePreferences, type ThemePreference } from "@/stores/preferences";
import { useInstall } from "@/features/install/useInstall";
import { IosInstallSheet } from "@/features/install/IosInstallSheet";
import { useState } from "react";
import { useMe, useUploadAvatar } from "./hooks";

const THEMES: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "auto", label: "Auto", icon: SunMoon },
  { value: "day", label: "Jour", icon: Sun },
  { value: "evening", label: "Soir", icon: Moon },
];

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 px-1 text-caption font-semibold tracking-wide text-ink-3 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function MePage() {
  const { data: me } = useMe();
  const upload = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, setTheme } = usePreferences();
  const install = useInstall();
  const [iosOpen, setIosOpen] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return toast.error("Choisis une image JPEG, PNG ou WebP.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image trop lourde (5 Mo max).");
    toast.promise(upload.mutateAsync(file), {
      loading: "Envoi de la photo…",
      success: "Photo mise à jour ✨",
      error: "L'envoi a échoué, réessaie.",
    });
  };

  const logout = async () => {
    await signOut();
    qc.clear();
    navigate("/signin", { replace: true });
  };

  return (
    <>
      <PageHeader title="Moi" />
      <div className="px-4">
        <div className="flex flex-col items-center rounded-3xl bg-surface p-6 shadow-card">
          {me ? (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="pressable relative"
                aria-label="Changer ma photo"
              >
                <Avatar name={me.name} image={me.image} tone="violet" size="lg" />
                <span className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full bg-ink text-bg ring-4 ring-surface">
                  <Camera className="size-4" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <p className="mt-4 font-display text-title font-bold">{me.name}</p>
              <p className="text-ink-3">{me.email}</p>
            </>
          ) : (
            <>
              <Skeleton className="size-24 rounded-full" />
              <Skeleton className="mt-4 h-6 w-32" />
            </>
          )}
        </div>

        <Section title="Apparence">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-1">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "pressable flex h-11 items-center justify-center gap-2 rounded-xl font-semibold text-ink-3",
                  theme === value && "bg-surface text-ink shadow-card",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <p className="mt-2 px-1 text-caption text-ink-3">Auto : clair en journée, soir à partir de 19h.</p>
        </Section>

        {install.canInstall && (
          <Section title="Application">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => (install.canPrompt ? install.prompt() : setIosOpen(true))}
            >
              <Download /> Installer Noo sur ce téléphone
            </Button>
          </Section>
        )}

        <Button variant="ghost" className="mt-8 w-full text-danger" onClick={logout}>
          <LogOut /> Se déconnecter
        </Button>
      </div>
      <IosInstallSheet open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}
