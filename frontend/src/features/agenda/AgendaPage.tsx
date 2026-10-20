import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { fmt } from "@/lib/dates";

export default function AgendaPage() {
  return (
    <>
      <PageHeader subtitle={fmt(new Date(), "MMMM yyyy")} title="Agenda" />
      <div className="px-4">
        <EmptyState emoji="📅" title="Votre semaine est libre">
          Planifie un resto, un ciné ou juste une soirée canapé.
        </EmptyState>
      </div>
    </>
  );
}
