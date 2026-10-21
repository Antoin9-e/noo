import { create } from "zustand";
import type { NooEvent, Wish, WishCategory } from "@/types";

export type EventDraft = Partial<NooEvent> & { forWhom?: "me" | "partner" | "both" };
export type AddKind = "EVENT" | WishCategory;
export type AddDraft = { kind: AddKind; title?: string };
export type NoteDraft = { text?: string; spotifyUrl?: string };

interface UiState {
  // Sheets ouvrables depuis n'importe quel écran
  eventDraft: EventDraft | null;
  openEvent: (draft: EventDraft) => void;
  closeEvent: () => void;

  // Quick Add (bouton +) et ajout depuis une catégorie
  addDraft: AddDraft | null;
  openAdd: (draft: AddDraft) => void;
  closeAdd: () => void;

  // Écrire un mot (ou partager une musique)
  noteDraft: NoteDraft | null;
  openNote: (draft?: NoteDraft) => void;
  closeNote: () => void;

  wishId: string | null;
  openWish: (id: string) => void;
  closeWish: () => void;

  // Célébration plein écran « C'est un match ! »
  matched: Wish | null;
  celebrate: (wish: Wish) => void;
  closeCelebration: () => void;
}

export const useUi = create<UiState>()((set) => ({
  eventDraft: null,
  openEvent: (eventDraft) => set({ eventDraft }),
  closeEvent: () => set({ eventDraft: null }),

  addDraft: null,
  openAdd: (addDraft) => set({ addDraft }),
  closeAdd: () => set({ addDraft: null }),

  noteDraft: null,
  openNote: (noteDraft = {}) => set({ noteDraft }),
  closeNote: () => set({ noteDraft: null }),

  wishId: null,
  openWish: (wishId) => set({ wishId }),
  closeWish: () => set({ wishId: null }),

  matched: null,
  celebrate: (matched) => set({ matched }),
  closeCelebration: () => set({ matched: null }),
}));
