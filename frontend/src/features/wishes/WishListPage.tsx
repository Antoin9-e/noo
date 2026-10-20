import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { useUi } from "@/stores/ui";
import { cn } from "@/lib/utils";
import { categoryBySlug } from "./categories";
import { useWishes } from "./hooks";
import { WishCard } from "./WishCard";

type Tab = "matches" | "all" | "done";

export default function WishListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const meta = slug ? categoryBySlug[slug] : undefined;
  const { data: wishes, isLoading } = useWishes();
  const openAdd = useUi((s) => s.openAdd);
  const isGift = meta?.key === "GIFT";
  const [tab, setTab] = useState<Tab>(isGift ? "all" : "matches");

  if (!meta) return <Navigate to="/envies" replace />;

  const inCategory = wishes?.filter((w) => w.category === meta.key) ?? [];
  const lists: Record<Tab, typeof inCategory> = {
    matches: inCategory.filter((w) => w.status === "OPEN" && w.isMatch),
    all: inCategory.filter((w) => w.status === "OPEN"),
    done: inCategory.filter((w) => w.status === "DONE"),
  };
  const tabs: Array<{ key: Tab; label: string }> = isGift
    ? [{ key: "all", label: "Idées" }, { key: "done", label: "Offerts" }]
    : [{ key: "matches", label: "Matchs" }, { key: "all", label: "Toutes" }, { key: "done", label: "Faites" }];
  const current = lists[tab];

  return (
    <>
      <PageHeader
        left={
          <Button variant="ghost" size="icon" aria-label="Retour" onClick={() => navigate("/envies")} className="-ml-2 self-end">
            <ChevronLeft className="size-6" />
          </Button>
        }
        subtitle="Envies"
        title={`${meta.emoji} ${meta.label}`}
        right={
          <Button variant="gradient" size="icon" aria-label={`Ajouter (${meta.singular})`} onClick={() => openAdd({ kind: meta.key })}>
            <Plus />
          </Button>
        }
      />
      <div className="px-4">
        <div className={cn("mb-5 grid gap-1 rounded-2xl bg-surface-2 p-1", tabs.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn("h-9 rounded-xl text-caption font-semibold text-ink-3", tab === t.key && "bg-surface text-ink shadow-card")}
            >
              {t.label} <span className="opacity-60">{lists[t.key].length}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[2/3]" />)}
          </div>
        ) : current.length === 0 ? (
          <EmptyState
            emoji={tab === "matches" ? "💞" : tab === "done" ? "📖" : meta.emoji}
            title={
              tab === "matches"
                ? "Pas encore de match"
                : tab === "done"
                  ? "Votre historique est vide"
                  : "Liste vide pour l'instant"
            }
            action={
              tab === "matches" ? (
                <Button variant="gradient" onClick={() => navigate("/envies/match")}>Aller matcher</Button>
              ) : tab === "all" ? (
                <Button variant="gradient" onClick={() => openAdd({ kind: meta.key })}>
                  <Plus /> Ajouter
                </Button>
              ) : undefined
            }
          >
            {tab === "matches"
              ? "Quand vous dites oui tous les deux, ça apparaît ici."
              : tab === "done"
                ? "Marquez une envie « faite » pour garder le souvenir."
                : isGift
                  ? "Note les idées au fil de l'eau, elles restent secrètes."
                  : "Ajoute la première, l'autre pourra la matcher."}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {current.map((w) => (
              <WishCard key={w.id} wish={w} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
