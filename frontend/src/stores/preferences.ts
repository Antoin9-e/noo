import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddKind } from "./ui";

export type ThemePreference = "auto" | "day" | "evening";

interface PreferencesState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  // Dernier type utilisé dans le Quick Add
  lastAddKind: AddKind;
  setLastAddKind: (kind: AddKind) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "auto",
      setTheme: (theme) => set({ theme }),
      lastAddKind: "EVENT",
      setLastAddKind: (lastAddKind) => set({ lastAddKind }),
    }),
    { name: "noo-preferences" },
  ),
);
