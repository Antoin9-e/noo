import type { ReactNode } from "react";
import { Logo } from "@/components/common/Logo";

// Ambiance « Crépuscule » en haut, formulaire dans une feuille en bas (à portée du pouce)
export function AuthLayout({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#120a22]">
      <div className="pt-safe relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,#4c1d95_0%,transparent_60%),radial-gradient(90%_70%_at_100%_100%,rgb(249_115_22/0.55)_0%,transparent_60%)]" />
        <div className="relative animate-pop">
          <div className="mx-auto mb-4 grid size-20 place-items-center rounded-[28px] bg-white/95 shadow-[0_20px_50px_-12px_rgb(249_115_22/0.5)]">
            <Logo className="size-14" />
          </div>
          <p className="font-display text-[44px] leading-none font-bold tracking-tight text-white">Noo</p>
          <p className="mt-3 text-white/70">Votre petit monde à deux.</p>
        </div>
      </div>
      <main className="relative -mt-8 rounded-t-4xl bg-bg px-6 pt-8 pb-[max(env(safe-area-inset-bottom),24px)]">
        <h1 className="text-display font-bold">{title}</h1>
        <p className="mb-6 text-ink-3">{subtitle}</p>
        {children}
        <div className="mt-6 text-center text-ink-3">{footer}</div>
      </main>
    </div>
  );
}
