import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    resetWatchlist: vi.fn(),
    clearRecentSearches: vi.fn(),
  };
});

vi.mock("react-native-mmkv", () => ({
  createMMKV: () => ({
    getString: (key: string) => m.store.get(key),
    set: (key: string, value: string) => m.store.set(key, value),
    remove: (key: string) => m.store.delete(key),
    clearAll: () => m.store.clear(),
  }),
}));
vi.mock("@/stores/watchlist.store", () => ({
  useWatchlistStore: { getState: () => ({ reset: m.resetWatchlist }) },
}));
vi.mock("@/stores/recent-searches.store", () => ({
  useRecentSearchesStore: {
    getState: () => ({ clearAll: m.clearRecentSearches }),
  },
}));

import { clearAllMMKV, mmkv, THEME_KEY } from "@/lib/mmkv";

beforeEach(() => {
  m.store.clear();
  vi.clearAllMocks();
});

describe("clearAllMMKV", () => {
  it("keeps the saved theme", () => {
    mmkv.set(THEME_KEY, "tokyoNight");

    clearAllMMKV();

    expect(mmkv.getString(THEME_KEY)).toBe("tokyoNight");
  });

  it("removes cached data and resets the account stores", () => {
    mmkv.set("REACT_QUERY_OFFLINE_CACHE", "{}");
    mmkv.set(THEME_KEY, "dracula");

    clearAllMMKV();

    expect(mmkv.getString("REACT_QUERY_OFFLINE_CACHE")).toBeUndefined();
    expect(m.resetWatchlist).toHaveBeenCalledOnce();
    expect(m.clearRecentSearches).toHaveBeenCalledOnce();
  });

  it("does not write a theme when none was saved", () => {
    clearAllMMKV();

    expect(mmkv.getString(THEME_KEY)).toBeUndefined();
  });
});
