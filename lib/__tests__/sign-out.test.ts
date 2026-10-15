import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  deleteToken: vi.fn(),
  deletePAT: vi.fn(),
  clearAllMMKV: vi.fn(),
}));

vi.mock("@/lib/secure-storage", () => ({
  deleteToken: m.deleteToken,
  deletePAT: m.deletePAT,
}));
vi.mock("@/lib/mmkv", () => ({ clearAllMMKV: m.clearAllMMKV }));

import { signOut } from "@/lib/sign-out";
import { useAuthStore } from "@/stores/auth.store";

describe("signOut", () => {
  const queryClient = { clear: vi.fn() } as unknown as QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    m.deleteToken.mockResolvedValue(undefined);
    m.deletePAT.mockResolvedValue(undefined);
    useAuthStore.setState({ token: "t", user: null, pat: "ghp_abc" });
  });

  it("deletes the stored PAT along with the OAuth token", async () => {
    await signOut(queryClient);
    expect(m.deleteToken).toHaveBeenCalled();
    expect(m.deletePAT).toHaveBeenCalled();
  });

  it("deletes both tokens before clearing auth, so a restore can't find them", async () => {
    const clearAuth = vi.spyOn(useAuthStore.getState(), "clearAuth");
    await signOut(queryClient);
    expect(m.deletePAT.mock.invocationCallOrder[0]).toBeLessThan(
      clearAuth.mock.invocationCallOrder[0],
    );
    expect(m.deleteToken.mock.invocationCallOrder[0]).toBeLessThan(
      clearAuth.mock.invocationCallOrder[0],
    );
  });

  it("clears auth state, the query cache and MMKV", async () => {
    await signOut(queryClient);
    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null, pat: null });
    expect(queryClient.clear).toHaveBeenCalled();
    expect(m.clearAllMMKV).toHaveBeenCalled();
  });
});
