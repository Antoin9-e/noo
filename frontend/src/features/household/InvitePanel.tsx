import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText, shareLink } from "@/lib/share";
import { useCreateInvitation } from "./hooks";
import { toast } from "sonner";

function invitationUrl(token: string) {
  return `${window.location.origin}/join/${token}`;
}

// Génère un lien frais à chaque partage (valable 7 jours, l'ancien expire)
export function InvitePanel({ familyId, familyName, inviterName }: {
  familyId: string;
  familyName: string;
  inviterName: string;
}) {
  const invite = useCreateInvitation(familyId);

  const run = async (mode: "share" | "copy") => {
    try {
      const { token } = await invite.mutateAsync();
      const url = invitationUrl(token);
      if (mode === "copy") return copyText(url);
      await shareLink({
        title: "Rejoins-moi sur Noo",
        text: `${inviterName} t'invite à rejoindre « ${familyName} » sur Noo 💜🧡`,
        url,
      });
    } catch {
      toast.error("Impossible de créer le lien, réessaie.");
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="gradient" size="lg" className="w-full" onClick={() => run("share")} disabled={invite.isPending}>
        <Send /> Envoyer l'invitation
      </Button>
      <Button variant="secondary" className="w-full" onClick={() => run("copy")} disabled={invite.isPending}>
        <Copy /> Copier le lien
      </Button>
      <p className="text-center text-caption text-ink-3">Le lien est valable 7 jours.</p>
    </div>
  );
}
