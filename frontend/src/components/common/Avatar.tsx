import { cn } from "@/lib/utils";

export type Tone = "violet" | "orange" | "both" | "none";

const SIZES = { xs: "size-6 text-[11px]", sm: "size-8 text-caption", md: "size-11 text-body", lg: "size-24 text-display" };

const RING: Record<Tone, string> = {
  violet: "bg-violet",
  orange: "bg-orange",
  both: "bg-gradient-noo",
  none: "bg-transparent",
};

const FILL: Record<Tone, string> = {
  violet: "bg-violet-soft text-violet",
  orange: "bg-orange-soft text-orange",
  both: "bg-gradient-noo-soft text-ink",
  none: "bg-surface-2 text-ink-2",
};

interface Props {
  name: string;
  image?: string | null;
  tone?: Tone;
  size?: keyof typeof SIZES;
  className?: string;
}

// Photo > initiale ; anneau à la couleur de la personne
export function Avatar({ name, image, tone = "none", size = "md", className }: Props) {
  return (
    <span className={cn("inline-grid shrink-0 rounded-full p-[2px]", RING[tone], className)}>
      <span className="rounded-full bg-surface p-[2px]">
        <span
          className={cn(
            "grid place-items-center overflow-hidden rounded-full font-display font-bold",
            SIZES[size],
            FILL[tone],
          )}
        >
          {image ? (
            <img src={image} alt={name} className="size-full object-cover" />
          ) : (
            name.trim().charAt(0).toUpperCase() || "?"
          )}
        </span>
      </span>
    </span>
  );
}
