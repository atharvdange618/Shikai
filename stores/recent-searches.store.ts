import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

const recentSearchesMMKV = createMMKV({ id: "shikai-recent-searches" });
const STORAGE_KEY = "recent_search_terms";
const MAX_TERMS = 20;

const recentSearchesStorage: PersistStorage<string[]> = {
  getItem: (name) => {
    const raw = recentSearchesMMKV.getString(name);
    if (!raw) return null;
    try {
      return { state: JSON.parse(raw) };
    } catch {
      return { state: [] };
    }
  },
  setItem: (name, value) =>
    recentSearchesMMKV.set(name, JSON.stringify(value.state)),
  removeItem: (name) => recentSearchesMMKV.remove(name),
};

interface RecentSearchesState {
  terms: string[];
  addTerm: (term: string) => void;
  removeTerm: (term: string) => void;
  clearAll: () => void;
}

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
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
        set({ terms: next });
      },

      removeTerm: (term: string) => {
        const next = get().terms.filter((t) => t !== term);
        set({ terms: next });
      },

      clearAll: () => set({ terms: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: recentSearchesStorage,
      partialize: (state) => state.terms,
      merge: (persisted, current) => ({
        ...current,
        terms: Array.isArray(persisted) ? persisted : [],
      }),
    },
  ),
);
