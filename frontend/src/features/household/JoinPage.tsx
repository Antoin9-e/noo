import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { Logo } from "@/components/common/Logo";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api";
import { firstName } from "@/lib/dates";
import { toneOf } from "@/lib/person-color";
import { useAcceptInvitation, useInvitation } from "./hooks";

export default function JoinPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: invitation, isLoading, error } = useInvitation(token);
  const accept = useAcceptInvitation();
  const next = encodeURIComponent(`/join/${token}`);

  const join = async () => {
    try {
      await accept.mutateAsync(token!);
      toast.success("Bienvenue dans votre petit monde 💜🧡");
      navigate("/", { replace: true });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de rejoindre, réessaie.");
    }
  };

  if (error || (invitation && !invitation.valid)) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <EmptyState
          emoji="⏳"
          title={error ? "Invitation introuvable" : "Ce lien a expiré"}
          action={
            <Button asChild variant="secondary">
              <Link to="/">Aller à l'accueil</Link>
            </Button>
          }
        >
          Demande un nouveau lien à la personne qui t'a invité·e.
        </EmptyState>
      </div>
    );
  }

  const inviter = invitation?.inviter ? firstName(invitation.inviter.name) : "Quelqu'un";

  return (
    <div className="pt-safe mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {isLoading || !invitation ? (
          <>
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="mt-6 h-8 w-60" />
          </>
        ) : (
          <div className="animate-rise flex flex-col items-center">
            <div className="flex items-center">
              <Avatar name={invitation.inviter?.name ?? "?"} image={invitation.inviter?.image} tone={toneOf(invitation.inviter?.color)} size="lg" />
              <span className="-ml-6 grid size-[100px] place-items-center rounded-full bg-surface ring-4 ring-bg">
                <Logo className="size-14" />
              </span>
            </div>
            <p className="mt-8 text-ink-2">{inviter} t'invite à rejoindre</p>
            <h1 className="mt-1 text-display font-bold text-gradient-noo">{invitation.familyName}</h1>
            <p className="mt-3 max-w-[32ch] text-ink-3">Agenda à deux, envies à matcher, soirées à tirer au sort.</p>
          </div>
        )}
      </div>

      {sessionPending ? null : session ? (
        <Button variant="gradient" size="lg" className="w-full" onClick={join} disabled={accept.isPending || !invitation}>
          {accept.isPending ? "Un instant…" : "Rejoindre"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button asChild variant="gradient" size="lg" className="w-full">
            <Link to={`/signup?next=${next}`}>Créer mon compte</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link to={`/signin?next=${next}`}>J'ai déjà un compte</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
