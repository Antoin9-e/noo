import { Sheet } from "@/components/common/Sheet";

export function QuickAddSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Ajouter">
      <p className="pb-4 text-ink-3">Bientôt : événements et envies en un geste.</p>
    </Sheet>
  );
}
