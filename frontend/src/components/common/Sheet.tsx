import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

// Bottom sheet mobile (vaul) : glisser vers le bas pour fermer
export function Sheet({ open, onOpenChange, title, description, children, className }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-[#120a22]/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-lg flex-col rounded-t-4xl bg-bg outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-ink/15" />
          <div className="px-6 pt-3 pb-2">
            <Drawer.Title className="font-display text-title font-bold">{title}</Drawer.Title>
            <Drawer.Description className={description ? "text-ink-3" : "sr-only"}>
              {description ?? title}
            </Drawer.Description>
          </div>
          <div className="overflow-y-auto px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
