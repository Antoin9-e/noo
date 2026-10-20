import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <img src="/logo.svg" alt="" aria-hidden className={cn("size-10", className)} />;
}
