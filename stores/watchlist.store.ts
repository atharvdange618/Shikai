import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";

const watchlistStorage = createMMKV({ id: "shikai-watchlist" });

const STORAGE_KEY = "watchlist_repo_ids";

function loadWatchlist(): string[] {
  const raw = watchlistStorage.getString(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveWatchlist(ids: string[]) {
  watchlistStorage.set(STORAGE_KEY, JSON.stringify(ids));
}

interface WatchlistState {
  watchlistIds: string[];
  isWatchlisted: (repoId: string) => boolean;
  toggleWatchlist: (repoId: string) => void;
  init: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlistIds: [],

  isWatchlisted: (repoId: string) => get().watchlistIds.includes(repoId),

  toggleWatchlist: (repoId: string) => {
    const { watchlistIds } = get();
    const next = watchlistIds.includes(repoId)
      ? watchlistIds.filter((id) => id !== repoId)
      : [...watchlistIds, repoId];
    saveWatchlist(next);
    set({ watchlistIds: next });
  },

  init: () => {
    set({ watchlistIds: loadWatchlist() });
  },
}));
