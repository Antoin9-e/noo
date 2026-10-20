import { Outlet } from "react-router-dom";
import { TabBar } from "./TabBar";
import { AddSheet } from "@/features/quick-add/AddSheet";
import { WishSheet } from "@/features/wishes/WishSheet";
import { MatchCelebration } from "@/features/wishes/MatchCelebration";
import { useUi } from "@/stores/ui";
import { usePreferences } from "@/stores/preferences";
import { InstallBanner } from "@/features/install/InstallBanner";
import { EventSheet } from "@/features/agenda/EventSheet";

export function AppShell() {
  const openAdd = useUi((s) => s.openAdd);
  const lastKind = usePreferences((s) => s.lastAddKind);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <Outlet />
      <InstallBanner />
      <TabBar onAdd={() => openAdd({ kind: lastKind })} />
      <AddSheet />
      <WishSheet />
      <MatchCelebration />
      <EventSheet />
    </div>
  );
}
