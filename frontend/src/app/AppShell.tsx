import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TabBar } from "./TabBar";
import { QuickAddSheet } from "@/features/quick-add/QuickAddSheet";
import { InstallBanner } from "@/features/install/InstallBanner";
import { EventSheet } from "@/features/agenda/EventSheet";

export function AppShell() {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <Outlet />
      <InstallBanner />
      <TabBar onAdd={() => setAdding(true)} />
      <QuickAddSheet open={adding} onOpenChange={setAdding} />
      <EventSheet />
    </div>
  );
}
