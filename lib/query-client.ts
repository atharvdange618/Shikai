/**
 * lib/query-client.ts
 *
 * staleTime decisions:
 *   5 min  — repos, stars (change occasionally)
 *   10 min — user profile, contributors (very stable)
 *   15 min — contribution graph, pinned repos (changes rarely)
 *   1 min  — commits, events (most likely to be fresh)
 */

import { GitHubApiError } from "@/lib/axios";
import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState } from "react-native";

export function setupFocusManager(): void {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener("change", (state) => {
      handleFocus(state === "active");
    });
    return () => subscription.remove();
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error) => {
        if (error instanceof GitHubApiError) {
          if (error.status === 401 || error.status === 404) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

export const queryKeys = {
  user: () => ["user"] as const,
  repos: () => ["repos"] as const,
  starred: () => ["starred"] as const,
  pinned: () => ["pinned"] as const,
  contributions: () => ["contributions"] as const,
  events: (username: string) => ["events", username] as const,
  repo: (owner: string, repo: string) => ["repo", owner, repo] as const,
  repoLanguages: (owner: string, repo: string) =>
    ["repo", owner, repo, "langs"] as const,
  repoCommits: (owner: string, repo: string) =>
    ["repo", owner, repo, "commits"] as const,
  repoLastCommit: (owner: string, repo: string) =>
    ["repo", owner, repo, "lastCommit"] as const,
  repoContributors: (owner: string, repo: string) =>
    ["repo", owner, repo, "contributors"] as const,
  repoFileTree: (owner: string, repo: string) =>
    ["repo", owner, repo, "tree"] as const,
  repoFile: (owner: string, repo: string, path: string) =>
    ["repo", owner, repo, "file", path] as const,
  repoReadme: (owner: string, repo: string) =>
    ["repo", owner, repo, "readme"] as const,
  repoCommitCount: (owner: string, repo: string) =>
    ["repo", owner, repo, "commitCount"] as const,
} as const;
