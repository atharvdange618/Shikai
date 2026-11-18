import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  isRateLimited: vi.fn(() => false),
  routerPrefetch: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({ isRateLimited: m.isRateLimited }));
vi.mock("@/lib/github-rest", () => ({
  fetchAuthenticatedUser: vi.fn(),
  fetchCommits: vi.fn(),
  fetchFileContent: vi.fn(),
  fetchFileTree: vi.fn(),
  fetchLanguages: vi.fn(),
  fetchLastCommit: vi.fn(),
  fetchRepo: vi.fn(),
  fetchSocialAccounts: vi.fn(),
  fetchUserEvents: vi.fn(),
}));
vi.mock("@/lib/github-graphql", () => ({
  fetchCommitCount: vi.fn(),
  fetchContributionGraph: vi.fn(),
  fetchPinnedRepos: vi.fn(),
  fetchRepoCount: vi.fn(),
  fetchRepoIssuesPRStats: vi.fn(),
}));
vi.mock("@/lib/query-client", () => ({
  queryKeys: new Proxy(
    {},
    {
      get:
        (_target, name) =>
        (...args: unknown[]) => [name, ...args],
    },
  ),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ pat: null }) },
}));
vi.mock("expo-router", () => ({ router: { prefetch: m.routerPrefetch } }));

import {
  prefetchCommonFiles,
  prefetchFileContent,
  prefetchFileTree,
  prefetchOverview,
  prefetchProfile,
  prefetchRepoCommits,
  prefetchRepoDetails,
  prefetchRoute,
} from "@/lib/prefetch";

const client = {
  prefetchQuery: vi.fn(() => Promise.resolve()),
  prefetchInfiniteQuery: vi.fn(() => Promise.resolve()),
  getQueryData: vi.fn(() => ({ default_branch: "main" })),
};
const queryClient = client as unknown as QueryClient;

function runAllPrefetches(): void {
  prefetchRepoDetails(queryClient, "o", "r");
  prefetchFileTree(queryClient, "o", "r");
  prefetchFileContent(queryClient, "o", "r", "README.md");
  prefetchCommonFiles(queryClient, "o", "r", [{ path: "README.md", type: "blob" } as never]);
  prefetchRepoCommits(queryClient, "o", "r");
  prefetchProfile(queryClient);
  prefetchOverview(queryClient, "octocat");
}

beforeEach(() => {
  vi.clearAllMocks();
  m.isRateLimited.mockReturnValue(false);
});

describe("prefetch and the GitHub rate limit", () => {
  it("prefetches when GitHub has requests left", () => {
    runAllPrefetches();
    expect(client.prefetchQuery).toHaveBeenCalled();
    expect(client.prefetchInfiniteQuery).toHaveBeenCalled();
  });

  it("sends no prefetch requests while rate limited", () => {
    m.isRateLimited.mockReturnValue(true);
    runAllPrefetches();
    expect(client.prefetchQuery).not.toHaveBeenCalled();
    expect(client.prefetchInfiniteQuery).not.toHaveBeenCalled();
  });

  it("still warms routes while rate limited, since that costs no API call", () => {
    m.isRateLimited.mockReturnValue(true);
    prefetchRoute("/repo/1");
    expect(m.routerPrefetch).toHaveBeenCalledWith("/repo/1");
  });
});
