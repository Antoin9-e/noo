import type { ReactNode } from "react";

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  left?: ReactNode;
}

export function PageHeader({ title, subtitle, right, left }: Props) {
  return (
    <header className="pt-safe flex items-end gap-3 px-4 pb-4">
      {left}
      <div className="min-w-0 flex-1 pt-4">
        {subtitle && <p className="text-caption font-medium text-ink-3 first-letter:uppercase">{subtitle}</p>}
        <h1 className="truncate text-display font-bold">{title}</h1>
      </div>
      {right}
    </header>
  );
}
