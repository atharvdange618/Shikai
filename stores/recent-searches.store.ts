import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";

const storage = createMMKV({ id: "shikai-recent-searches" });

const STORAGE_KEY = "recent_search_terms";
const MAX_TERMS = 20;

function loadTerms(): string[] {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTerms(terms: string[]) {
  storage.set(STORAGE_KEY, JSON.stringify(terms));
}

interface RecentSearchesState {
  terms: string[];
  addTerm: (term: string) => void;
  removeTerm: (term: string) => void;
  clearAll: () => void;
  init: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesState>(
  (set, get) => ({
    terms: [],

    addTerm: (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      const { terms } = get();
      const next = [trimmed, ...terms.filter((t) => t !== trimmed)].slice(
        0,
        MAX_TERMS,
      );
      saveTerms(next);
      set({ terms: next });
    },

    removeTerm: (term: string) => {
      const next = get().terms.filter((t) => t !== term);
      saveTerms(next);
      set({ terms: next });
    },

    clearAll: () => {
      saveTerms([]);
      set({ terms: [] });
    },

    init: () => {
      set({ terms: loadTerms() });
    },
  }),
);
