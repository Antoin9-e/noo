import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "auto" | "day" | "evening";

interface PreferencesState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "auto",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "noo-preferences" },
  ),
);
