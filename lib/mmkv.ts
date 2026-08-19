import { createMMKV } from "react-native-mmkv";
import { useRecentSearchesStore } from "@/stores/recent-searches.store";
import { useWatchlistStore } from "@/stores/watchlist.store";

export const mmkv = createMMKV({ id: "shikai-cache" });

export const mmkvStorage = {
  getItem: async (key: string) => mmkv.getString(key) ?? null,
  setItem: async (key: string, value: string) => mmkv.set(key, value),
  removeItem: async (key: string) => { mmkv.remove(key); },
};

// Clears every MMKV-backed store, not just the React Query cache instance.
// Must stay exhaustive: watchlist/recent-searches are account-specific data
// that would otherwise leak into the next account signed in on this device.
export function clearAllMMKV() {
  mmkv.clearAll();
  useWatchlistStore.getState().reset();
  useRecentSearchesStore.getState().clearAll();
}
