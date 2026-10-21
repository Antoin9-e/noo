import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/common/Switch";
import { Button } from "@/components/ui/button";
import { usePush } from "./usePush";

const HINT: Record<string, string> = {
  unsupported: "Ce navigateur ne gère pas les notifications.",
  "needs-install": "Sur iPhone, installe d'abord Noo sur l'écran d'accueil.",
  disabled: "Les notifications ne sont pas encore configurées sur le serveur.",
  denied: "Bloquées : réautorise Noo dans les réglages du téléphone.",
};

export function NotificationsSection() {
  const push = usePush();
  const available = push.state === "on" || push.state === "off";

  return (
    <div className="rounded-3xl bg-surface p-4 shadow-card">
      {available ? (
        <>
          <Switch
            checked={push.state === "on"}
            onChange={async (v) => {
              try {
                if (v) {
                  if (await push.enable()) toast.success("Notifications activées 🔔");
                } else await push.disable();
              } catch {
                toast.error("Impossible d'activer les notifications");
              }
            }}
            label="Notifications"
            hint="Matchs, nouvelles envies, plans à deux, rappels 1 h avant"
          />
          {push.state === "on" && (
            <Button variant="ghost" size="sm" className="mt-1 -ml-2" onClick={() => push.test()}>
              <BellRing className="size-4" /> M'envoyer un test
            </Button>
          )}
        </>
      ) : (
        <p className="text-ink-3">{HINT[push.state]}</p>
      )}
    </div>
  );
}
