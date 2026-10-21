import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type Props = ComponentProps<typeof Input> & { label: string; error?: string };

export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, error, id, ...props }, ref) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-caption font-semibold text-ink-2">
        {label}
      </label>
      <Input ref={ref} id={inputId} aria-invalid={!!error} {...props} />
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
});
