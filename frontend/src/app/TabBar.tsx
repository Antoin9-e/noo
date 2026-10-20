import { NavLink } from "react-router-dom";
import { CalendarDays, Plus, Sparkles, Sun, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { tap } from "@/lib/haptics";

const TABS: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }> = [
  { to: "/", label: "Aujourd'hui", icon: Sun, end: true },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/envies", label: "Envies", icon: Sparkles },
  { to: "/moi", label: "Moi", icon: UserRound },
];

function Tab({ to, label, icon: Icon, end }: (typeof TABS)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => tap(5)}
      className={({ isActive }) =>
        cn(
          "pressable flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
          isActive ? "text-ink" : "text-ink-3",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "grid h-8 w-14 place-items-center rounded-full transition-colors",
              isActive && "bg-violet-soft text-violet",
            )}
          >
            <Icon className="size-[22px]" strokeWidth={isActive ? 2.4 : 2} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export function TabBar({ onAdd }: { onAdd: () => void }) {
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[var(--tabbar)] backdrop-blur-xl"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg items-center px-2">
        <Tab {...TABS[0]!} />
        <Tab {...TABS[1]!} />
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            aria-label="Ajouter"
            onClick={() => {
              tap(12);
              onAdd();
            }}
            className="pressable -mt-6 grid size-14 place-items-center rounded-full bg-gradient-noo text-white shadow-float ring-4 ring-bg"
          >
            <Plus className="size-7" strokeWidth={2.6} />
          </button>
        </div>
        <Tab {...TABS[2]!} />
        <Tab {...TABS[3]!} />
      </div>
    </nav>
  );
}
