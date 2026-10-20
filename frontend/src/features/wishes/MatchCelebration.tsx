import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { usePush } from "@/features/push/usePush";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { toneOf } from "@/lib/person-color";
import { tap } from "@/lib/haptics";
import { categoryByKey } from "./categories";
import { WishImage } from "./WishImage";

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 7) * 120}ms`,
  size: 8 + ((i * 5) % 10),
}));

// Le moment fort de l'app : plein écran en dégradé, vibration, puis on propose de planifier
export function MatchCelebration() {
  const wish = useUi((s) => s.matched);
  const close = useUi((s) => s.closeCelebration);
  const openEvent = useUi((s) => s.openEvent);
  const { members } = useHousehold();
  const push = usePush();

  useEffect(() => {
    if (wish) tap([20, 60, 30, 60, 40]);
  }, [wish]);

  if (!wish) return null;
  const meta = categoryByKey[wish.category];

  const plan = () => {
    close();
    const start = new Date();
    start.setHours(20, 30, 0, 0);
    openEvent({ title: `${meta.emoji} ${wish.title}`, startAt: start.toISOString(), forWhom: "both" });
  };

  return createPortal(
    <div
      role="dialog"
      aria-label="C'est un match"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-gradient-noo px-8 text-center text-white"
      style={{ animation: "pop 420ms cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute bottom-[-20px] rounded-full bg-white/70"
          style={{ left: s.left, width: s.size, height: s.size, animation: `rise-far 2.4s ${s.delay} ease-out infinite` }}
        />
      ))}

      <div className="relative">
        <WishImage wish={wish} className="mx-auto h-48 w-32 rotate-[-4deg] rounded-3xl shadow-[0_24px_60px_-12px_rgb(0_0_0/0.45)]" emojiSize="text-[56px]" />
        <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 -space-x-3">
          {members.map((m) => (
            <Avatar key={m.user.id} name={m.user.name} image={m.user.image} tone={toneOf(m.color)} size="md" />
          ))}
        </div>
      </div>

      <p className="mt-12 font-display text-[40px] leading-none font-bold tracking-tight">C'est un match !</p>
      <p className="mt-3 max-w-[28ch] text-white/85">
        Vous avez tous les deux envie de <b>{wish.title}</b>.
      </p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        <Button size="lg" className="w-full bg-white text-[#4c1d95] shadow-card" onClick={plan}>
          <CalendarPlus /> Planifier
        </Button>
        {/* Opt-in au bon moment : juste après un match, jamais au premier lancement */}
        {push.state === "off" && (
          <Button
            variant="ghost"
            className="w-full bg-white/15 text-white"
            disabled={push.busy}
            onClick={async () => {
              if (await push.enable().catch(() => false)) toast.success("On te préviendra des prochains matchs 🔔");
            }}
          >
            <Bell /> Me prévenir des prochains matchs
          </Button>
        )}
        <Button variant="ghost" className="w-full text-white" onClick={close}>
          Continuer
        </Button>
      </div>
    </div>,
    document.body,
  );
}
