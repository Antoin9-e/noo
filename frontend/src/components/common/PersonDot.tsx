import { cn } from "@/lib/utils";
import { TONE_BG } from "@/lib/person-color";
import type { Tone } from "./Avatar";

export function PersonDot({ tone, className }: { tone: Tone; className?: string }) {
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", TONE_BG[tone], className)} />;
}
