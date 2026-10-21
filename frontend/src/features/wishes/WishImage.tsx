import { cn } from "@/lib/utils";
import type { Wish } from "@/types";
import { categoryByKey } from "./categories";

// Affiche (TMDB) ou tuile emoji sur fond doux de la catégorie
export function WishImage({ wish, className, emojiSize = "text-[40px]", emojiClassName }: {
  wish: Pick<Wish, "imageUrl" | "category" | "title">;
  className?: string;
  emojiSize?: string;
  emojiClassName?: string;
}) {
  const meta = categoryByKey[wish.category];
  if (wish.imageUrl) {
    return <img src={wish.imageUrl} alt="" loading="lazy" className={cn("object-cover", className)} />;
  }
  return (
    <div className={cn("grid place-items-center", meta.tint, className)}>
      <span className={cn(emojiSize, emojiClassName)}>{meta.emoji}</span>
    </div>
  );
}
