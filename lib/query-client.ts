/**
 * lib/query-client.ts
 *
 * staleTime decisions:
 *   5 min   - repos, stars (change occasionally)
 *   30 min  - user profile, social accounts, repo count (very stable)
 *   15 min  - contribution graph, pinned repos (changes rarely)
 *   1 min   - commits, events (most likely to be fresh)
 */

import { GitHubApiError, isRateLimited } from "@/lib/axios";
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
      gcTime: 1000 * 60 * 60,
      retry: (failureCount, error) => {
        if (error instanceof GitHubApiError) {
          if (error.status === 401 || error.status === 404) return false;
          if (error.status === 403 && isRateLimited()) return false;
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
  userProfile: (username: string) => ["userProfile", username] as const,
  userProfileRepos: (username: string) =>
    ["userProfile", username, "repos"] as const,
  userAllRepos: (username: string) =>
    ["userProfile", username, "repos", "all"] as const,
  userProfileEvents: (username: string) =>
    ["userProfile", username, "events"] as const,
  repos: () => ["repos"] as const,
  starred: () => ["starred"] as const,
  pinned: () => ["pinned"] as const,
  contributions: () => ["contributions-v2"] as const,
  events: (username: string) => ["events", username] as const,
  repo: (owner: string, repo: string) => ["repo", owner, repo] as const,
  repoLanguages: (owner: string, repo: string) =>
    ["repo", owner, repo, "langs"] as const,
  repoCommits: (owner: string, repo: string, branch?: string, path?: string) =>
    ["repo", owner, repo, "commits", branch, path] as const,
  repoLastCommit: (owner: string, repo: string) =>
    ["repo", owner, repo, "lastCommit"] as const,
  repoContributors: (owner: string, repo: string) =>
    ["repo", owner, repo, "contributors"] as const,
  repoFileTree: (owner: string, repo: string, branch: string) =>
    ["repo", owner, repo, "tree", branch] as const,
  repoBranches: (owner: string, repo: string) =>
    ["repo", owner, repo, "branches"] as const,
  repoFile: (owner: string, repo: string, path: string) =>
    ["repo", owner, repo, "file", path] as const,
  repoReadme: (owner: string, repo: string) =>
    ["repo", owner, repo, "readme"] as const,
  repoCommitCount: (owner: string, repo: string) =>
    ["repo", owner, repo, "commitCount"] as const,
  repoIssuesPRStats: (owner: string, repo: string) =>
    ["repo", owner, repo, "issuesPRStats"] as const,
  repoIssues: (owner: string, repo: string, state: "open" | "closed" | "all") =>
    ["repo", owner, repo, "issues", state] as const,
  repoPullRequests: (
    owner: string,
    repo: string,
    state: "open" | "closed" | "all",
  ) => ["repo", owner, repo, "pullRequests", state] as const,
  issueDetail: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "issue", number] as const,
  issueComments: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "issue", number, "comments"] as const,
  prDetail: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "pr", number] as const,
  prReviewComments: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "pr", number, "reviewComments"] as const,
  prFiles: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "pr", number, "files"] as const,
  prReviews: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "pr", number, "reviews"] as const,
  prRequestedReviewers: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "pr", number, "requestedReviewers"] as const,
  prCommits: (owner: string, repo: string, number: number) =>
    ["repo", owner, repo, "pr", number, "commits"] as const,
  commitChecks: (owner: string, repo: string, ref: string) =>
    ["repo", owner, repo, "commit", ref, "checks"] as const,
  checkRun: (owner: string, repo: string, runId: number) =>
    ["repo", owner, repo, "check-run", runId] as const,
  checkRunAnnotations: (owner: string, repo: string, runId: number) =>
    ["repo", owner, repo, "check-run", runId, "annotations"] as const,
  blame: (owner: string, repo: string, ref: string, path: string) =>
    ["repo", owner, repo, "blame", ref, path] as const,
  commitDetail: (owner: string, repo: string, sha: string) =>
    ["repo", owner, repo, "commit", sha] as const,
  comparison: (owner: string, repo: string, base: string, head: string) =>
    ["repo", owner, repo, "compare", base, head] as const,
  repoReleases: (owner: string, repo: string) =>
    ["repo", owner, repo, "releases"] as const,
  repoRelease: (owner: string, repo: string, tag: string) =>
    ["repo", owner, repo, "release", tag] as const,
  recentActivity: () => ["recentActivity"] as const,
  socialAccounts: () => ["socialAccounts"] as const,
  repoCount: () => ["repoCount"] as const,
  searchRepos: (query: string, sort?: string, order?: string) =>
    ["search", "repos", query, sort, order] as const,
  searchUsers: (query: string, sort?: string, order?: string) =>
    ["search", "users", query, sort, order] as const,
  searchIssues: (query: string, sort?: string, order?: string) =>
    ["search", "issues", query, sort, order] as const,
  notifications: () => ["notifications"] as const,
  receivedEvents: () => ["receivedEvents"] as const,
  gists: (username: string) => ["gists", username] as const,
  gist: (id: string) => ["gist", id] as const,
} as const;
