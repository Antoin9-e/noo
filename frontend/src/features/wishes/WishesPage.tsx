import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

export default function WishesPage() {
  return (
    <>
      <PageHeader subtitle="Films, restos, voyages…" title="Envies" />
      <div className="px-4">
        <EmptyState emoji="✨" title="Aucune envie pour l'instant">
          Ajoute le premier film que vous voulez voir ensemble !
        </EmptyState>
      </div>
    </>
  );
}
