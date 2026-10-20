import { create } from "zustand";
import type { NooEvent } from "@/types";

export type EventDraft = Partial<NooEvent> & { forWhom?: "me" | "partner" | "both" };

interface UiState {
  // Sheet d'événement, ouvrable depuis n'importe quel écran
  eventDraft: EventDraft | null;
  openEvent: (draft: EventDraft) => void;
  closeEvent: () => void;
}

export const useUi = create<UiState>()((set) => ({
  eventDraft: null,
  openEvent: (eventDraft) => set({ eventDraft }),
  closeEvent: () => set({ eventDraft: null }),
}));
