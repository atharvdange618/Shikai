import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

const watchlistMMKV = createMMKV({ id: "shikai-watchlist" });
const STORAGE_KEY = "watchlist_repo_ids";

const watchlistStorage: PersistStorage<string[]> = {
  getItem: (name) => {
    const raw = watchlistMMKV.getString(name);
    if (!raw) return null;
    try {
      return { state: JSON.parse(raw) };
    } catch {
      return { state: [] };
    }
  },
  setItem: (name, value) =>
    watchlistMMKV.set(name, JSON.stringify(value.state)),
  removeItem: (name) => watchlistMMKV.remove(name),
};

type FirstBookmarkCallback = () => void;

interface WatchlistState {
  watchlistIds: string[];
  isWatchlisted: (repoId: string) => boolean;
  toggleWatchlist: (repoId: string) => void;
  reset: () => void;
  onFirstBookmark: (cb: FirstBookmarkCallback) => void;
}

let firstBookmarkListener: FirstBookmarkCallback | null = null;

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlistIds: [],

      isWatchlisted: (repoId: string) => get().watchlistIds.includes(repoId),

      toggleWatchlist: (repoId: string) => {
        const { watchlistIds } = get();
        const isFirst = watchlistIds.length === 0;
        const next = watchlistIds.includes(repoId)
          ? watchlistIds.filter((id) => id !== repoId)
          : [...watchlistIds, repoId];
        set({ watchlistIds: next });
        if (isFirst && next.length === 1 && firstBookmarkListener) {
          firstBookmarkListener();
        }
      },

      reset: () => set({ watchlistIds: [] }),

      onFirstBookmark: (cb: FirstBookmarkCallback) => {
        firstBookmarkListener = cb;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: watchlistStorage,
      partialize: (state) => state.watchlistIds,
      merge: (persisted, current) => ({
        ...current,
        watchlistIds: Array.isArray(persisted) ? persisted : [],
      }),
    },
  ),
);
