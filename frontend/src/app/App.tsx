import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";
import { useThemeSync } from "@/lib/theme";
import { AppRoutes } from "./routes";

const DAY = 24 * 3600_000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 7 * DAY, // garder assez longtemps pour la persistance
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

// Ouverture instantanée et lecture hors-ligne : le cache survit à la fermeture de l'app
const persister = createSyncStoragePersister({
  storage: typeof window === "undefined" ? undefined : window.localStorage,
  key: "noo-cache",
});

export default function App() {
  useThemeSync();
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * DAY,
        buster: "1",
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => q.state.status === "success" && q.queryKey[0] !== "search" && q.queryKey[0] !== "invitation",
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster position="top-center" offset={{ top: "calc(env(safe-area-inset-top) + 8px)" }} />
    </PersistQueryClientProvider>
  );
}
