import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  deleteToken: vi.fn(),
  deletePAT: vi.fn(),
  getStoredPAT: vi.fn(),
  fetchPATOwner: vi.fn(),
  clearAllMMKV: vi.fn(),
}));

vi.mock("@/lib/secure-storage", () => ({
  deleteToken: m.deleteToken,
  deletePAT: m.deletePAT,
  getStoredPAT: m.getStoredPAT,
}));
vi.mock("@/lib/github-rest", () => ({ fetchPATOwner: m.fetchPATOwner }));
vi.mock("@/lib/mmkv", () => ({ clearAllMMKV: m.clearAllMMKV }));

import { restorePATFor, signOut } from "@/lib/session";
import { useAuthStore } from "@/stores/auth.store";

beforeEach(() => {
  vi.clearAllMocks();
  m.deleteToken.mockResolvedValue(undefined);
  m.deletePAT.mockResolvedValue(undefined);
});

describe("signOut", () => {
  const queryClient = { clear: vi.fn() } as unknown as QueryClient;

  beforeEach(() => {
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

describe("restorePATFor", () => {
  it("returns null without a network call when no PAT is stored", async () => {
    m.getStoredPAT.mockResolvedValue(null);
    await expect(restorePATFor("octocat")).resolves.toBeNull();
    expect(m.fetchPATOwner).not.toHaveBeenCalled();
  });

  it("keeps the PAT when it belongs to the account signing in", async () => {
    m.getStoredPAT.mockResolvedValue("ghp_abc");
    m.fetchPATOwner.mockResolvedValue("octocat");
    await expect(restorePATFor("octocat")).resolves.toBe("ghp_abc");
    expect(m.fetchPATOwner).toHaveBeenCalledWith("ghp_abc");
    expect(m.deletePAT).not.toHaveBeenCalled();
  });

  it("matches logins without regard to case", async () => {
    m.getStoredPAT.mockResolvedValue("ghp_abc");
    m.fetchPATOwner.mockResolvedValue("OctoCat");
    await expect(restorePATFor("octocat")).resolves.toBe("ghp_abc");
  });

  it("deletes the PAT when it belongs to a different account", async () => {
    m.getStoredPAT.mockResolvedValue("ghp_abc");
    m.fetchPATOwner.mockResolvedValue("someone-else");
    await expect(restorePATFor("octocat")).resolves.toBeNull();
    expect(m.deletePAT).toHaveBeenCalled();
  });

  it("deletes the PAT when its owner can't be confirmed", async () => {
    m.getStoredPAT.mockResolvedValue("ghp_abc");
    m.fetchPATOwner.mockRejectedValue(new Error("Bad credentials"));
    await expect(restorePATFor("octocat")).resolves.toBeNull();
    expect(m.deletePAT).toHaveBeenCalled();
  });
});
