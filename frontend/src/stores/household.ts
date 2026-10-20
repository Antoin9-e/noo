import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HouseholdState {
  activeFamilyId: string | null;
  setActiveFamilyId: (id: string | null) => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      activeFamilyId: null,
      setActiveFamilyId: (activeFamilyId) => set({ activeFamilyId }),
    }),
    { name: "noo-household" },
  ),
);
