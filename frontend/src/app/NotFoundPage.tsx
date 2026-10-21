import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <EmptyState
        emoji="🧭"
        title="Page introuvable"
        action={
          <Button asChild variant="gradient">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        }
      >
        Ce lien ne mène nulle part… mais vous deux, si.
      </EmptyState>
    </div>
  );
}
