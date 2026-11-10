import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  deleteToken: vi.fn(),
  deletePAT: vi.fn(),
  getStoredPAT: vi.fn(),
  fetchPATOwner: vi.fn(),
  fetchAuthenticatedUser: vi.fn(),
  clearAllMMKV: vi.fn(),
  GitHubApiError: class GitHubApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = "GitHubApiError";
    }
  },
}));

vi.mock("@/lib/secure-storage", () => ({
  deleteToken: m.deleteToken,
  deletePAT: m.deletePAT,
  getStoredPAT: m.getStoredPAT,
}));
vi.mock("@/lib/github-rest", () => ({
  fetchPATOwner: m.fetchPATOwner,
  fetchAuthenticatedUser: m.fetchAuthenticatedUser,
}));
vi.mock("@/lib/mmkv", () => ({ clearAllMMKV: m.clearAllMMKV }));
vi.mock("@/lib/axios", () => ({ GitHubApiError: m.GitHubApiError }));
vi.mock("@/lib/query-client", () => ({ queryKeys: { user: () => ["user"] } }));

import { revalidateSession, restorePATFor, signOut } from "@/lib/session";
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

describe("revalidateSession", () => {
  const user = { login: "octocat" } as never;
  const client = (fetchQuery: unknown) => ({ fetchQuery }) as unknown as QueryClient;

  beforeEach(() => {
    useAuthStore.setState({ token: "t", user: null, pat: null });
  });

  it("forces a round trip and stores the profile it returns", async () => {
    const fetchQuery = vi.fn().mockResolvedValue(user);
    await revalidateSession(client(fetchQuery));

    expect(fetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["user"], staleTime: 0 }),
    );
    expect(useAuthStore.getState().user).toBe(user);
  });

  it("signs out when GitHub rejects the token", async () => {
    const fetchQuery = vi.fn().mockRejectedValue(new m.GitHubApiError(401, "Bad credentials"));

    await revalidateSession(client(fetchQuery));

    expect(useAuthStore.getState().token).toBeNull();
  });

  it("keeps the session when the check can't reach GitHub", async () => {
    // Status 0 is offline, a timeout or a cancelled request (lib/sentry.ts).
    // Boot used to clear auth on it, so opening the app without signal signed
    // the user out.
    const fetchQuery = vi.fn().mockRejectedValue(new m.GitHubApiError(0, "Network Error"));

    await revalidateSession(client(fetchQuery));

    expect(useAuthStore.getState().token).toBe("t");
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
