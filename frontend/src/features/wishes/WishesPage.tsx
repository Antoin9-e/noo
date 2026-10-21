import { Link } from "react-router-dom";
import { Dices, Flame } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./categories";
import { useWishes } from "./hooks";
import { openMatches, toSwipe } from "./selectors";
import { WishCard } from "./WishCard";

export default function WishesPage() {
  const { data: wishes, isLoading } = useWishes();
  const pending = wishes ? toSwipe(wishes).length : 0;
  const matches = wishes ? openMatches(wishes) : [];

  return (
    <>
      <PageHeader subtitle="Films, restos, voyages…" title="Envies" />
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/envies/match" className="pressable relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-noo p-4 text-white shadow-float">
            <Flame className="size-7" />
            <span>
              <span className="block font-display text-title font-bold">Matcher</span>
              <span className="text-caption text-white/85">
                {pending ? `${pending} à swiper` : "Tout est swipé"}
              </span>
            </span>
            {pending > 0 && (
              <span className="absolute top-3 right-3 grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-caption font-bold text-[#7c3aed]">
                {pending}
              </span>
            )}
          </Link>
          <Link to="/ce-soir" className="pressable flex flex-col justify-between gap-6 rounded-3xl bg-ink p-4 text-bg shadow-card">
            <Dices className="size-7" />
            <span>
              <span className="block font-display text-title leading-tight font-bold">Ce soir on fait quoi ?</span>
            </span>
          </Link>
        </div>

        {matches.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-title font-bold">
              Vos matchs <span className="text-gradient-noo">{matches.length}</span>
            </h2>
            <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
              {matches.map((w) => (
                <div key={w.id} className="w-32 shrink-0 snap-start">
                  <WishCard wish={w} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-title font-bold">Catégories</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c, i) => {
              const list = wishes?.filter((w) => w.category === c.key && w.status === "OPEN") ?? [];
              const m = list.filter((w) => w.isMatch).length;
              return isLoading ? (
                <Skeleton key={c.key} className="h-28 rounded-3xl" />
              ) : (
                <Link
                  key={c.key}
                  to={`/envies/${c.slug}`}
                  className={cn(
                    "pressable flex h-28 flex-col justify-between rounded-3xl p-4",
                    c.tint,
                    i === CATEGORIES.length - 1 && CATEGORIES.length % 2 === 1 && "col-span-2 h-20 flex-row items-center",
                  )}
                >
                  <span className="text-[28px] leading-none">{c.emoji}</span>
                  <span>
                    <span className="block font-semibold">{c.label}</span>
                    <span className="text-caption text-ink-3">
                      {list.length === 0 ? "Vide" : `${list.length} envie${list.length > 1 ? "s" : ""}`}
                      {m > 0 && <span className="font-semibold text-gradient-noo"> · {m} match{m > 1 ? "s" : ""}</span>}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
