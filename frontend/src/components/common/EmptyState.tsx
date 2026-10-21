import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  emoji: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ emoji, title, children, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl bg-gradient-noo-soft px-6 py-8 text-center",
        className,
      )}
    >
      <div className="mb-3 grid size-14 place-items-center rounded-full bg-surface text-[28px] shadow-card">
        {emoji}
      </div>
      <p className="font-display text-title font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-[30ch] text-ink-2">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
