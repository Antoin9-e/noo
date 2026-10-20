import { Heart } from "lucide-react";
import { AvatarPair } from "@/components/common/AvatarPair";
import { useHousehold } from "@/features/household/hooks";
import { useUi } from "@/stores/ui";
import { cn } from "@/lib/utils";
import type { Wish } from "@/types";
import { WishImage } from "./WishImage";

export function WishCard({ wish }: { wish: Wish }) {
  const { members } = useHousehold();
  const openWish = useUi((s) => s.openWish);
  const yes = members.filter((m) => wish.yesBy.includes(m.user.id));
  const pending = wish.id.startsWith("temp-");

  return (
    <button
      type="button"
      onClick={() => !pending && openWish(wish.id)}
      className={cn("pressable flex w-full flex-col text-left", pending && "opacity-60")}
    >
      <div className={cn("relative w-full rounded-3xl p-[3px]", wish.isMatch ? "bg-gradient-noo shadow-float" : "bg-transparent")}>
        <WishImage wish={wish} className="aspect-[2/3] w-full rounded-[21px] shadow-card" />
        {wish.isMatch && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-gradient-noo px-2 py-1 text-[11px] font-bold text-white shadow-float">
            <Heart className="size-3 fill-current" /> Match
          </span>
        )}
        {wish.status === "DONE" && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-success px-2 py-1 text-[11px] font-bold text-white">Fait ✓</span>
        )}
      </div>
      <span className="mt-2 line-clamp-2 px-1 font-semibold leading-tight">{wish.title}</span>
      <span className="mt-1 flex items-center gap-2 px-1 text-caption text-ink-3">
        {yes.length > 0 && <AvatarPair members={yes} />}
        {wish.year}
      </span>
    </button>
  );
}
