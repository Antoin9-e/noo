import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, label, hint }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center gap-3 text-left"
    >
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-caption text-ink-3">{hint}</span>}
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-violet" : "bg-ink/15")}>
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
