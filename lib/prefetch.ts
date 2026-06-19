import type { QueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import {
  fetchCommitCount,
  fetchContributionGraph,
  fetchPinnedRepos,
  fetchRepoIssuesPRStats,
} from "@/lib/github-graphql";
import {
  fetchAuthenticatedUser,
  fetchCommits,
  fetchFileContent,
  fetchFileTree,
  fetchLanguages,
  fetchLastCommit,
  fetchRepo,
  fetchSocialAccounts,
} from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubRepo, GitHubTreeItem } from "@/types/github.types";

export function prefetchRoute(href: string) {
  router.prefetch(href as any);
}

export function prefetchRepoDetails(
  queryClient: QueryClient,
  owner: string,
  repo: string,
) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.repo(owner, repo),
    queryFn: () => fetchRepo(owner, repo),
    staleTime: 1000 * 60 * 5,
  });
  queryClient.prefetchQuery({
    queryKey: queryKeys.repoLanguages(owner, repo),
    queryFn: () => fetchLanguages(owner, repo),
    staleTime: 1000 * 60 * 10,
  });
  queryClient.prefetchQuery({
    queryKey: queryKeys.repoLastCommit(owner, repo),
    queryFn: () => fetchLastCommit(owner, repo),
    staleTime: 1000 * 60 * 2,
  });
  queryClient.prefetchQuery({
    queryKey: queryKeys.repoCommitCount(owner, repo),
    queryFn: () => fetchCommitCount(owner, repo),
    staleTime: 1000 * 60 * 5,
  });
  queryClient.prefetchQuery({
    queryKey: queryKeys.repoIssuesPRStats(owner, repo),
    queryFn: () => fetchRepoIssuesPRStats(owner, repo),
    staleTime: 1000 * 60 * 5,
  });
}

const COMMON_ENTRY_FILES = [
  "README.md",
  "package.json",
  "index.js",
  "index.ts",
  "index.tsx",
  "LICENSE",
  "CONTRIBUTING.md",
];

export function prefetchFileTree(
  queryClient: QueryClient,
  owner: string,
  repo: string,
) {
  const repoData = queryClient.getQueryData<GitHubRepo>(
    queryKeys.repo(owner, repo),
  );
  const defaultBranch = repoData?.default_branch;

  if (defaultBranch) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.repoFileTree(owner, repo, defaultBranch),
      queryFn: () => fetchFileTree(owner, repo, defaultBranch),
      staleTime: 1000 * 60 * 15,
    });
  } else {
    queryClient
      .prefetchQuery({
        queryKey: queryKeys.repo(owner, repo),
        queryFn: () => fetchRepo(owner, repo),
        staleTime: 1000 * 60 * 5,
      })
      .then(() => {
        const updatedRepo = queryClient.getQueryData<GitHubRepo>(
          queryKeys.repo(owner, repo),
        );
        if (updatedRepo?.default_branch) {
          queryClient.prefetchQuery({
            queryKey: queryKeys.repoFileTree(
              owner,
              repo,
              updatedRepo.default_branch,
            ),
            queryFn: () =>
              fetchFileTree(owner, repo, updatedRepo.default_branch),
            staleTime: 1000 * 60 * 15,
          });
        }
      });
  }
}

export function prefetchFileContent(
  queryClient: QueryClient,
  owner: string,
  repo: string,
  path: string,
) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.repoFile(owner, repo, path),
    queryFn: () => fetchFileContent(owner, repo, path),
    staleTime: 1000 * 60 * 15,
  });
}

export function prefetchCommonFiles(
  queryClient: QueryClient,
  owner: string,
  repo: string,
  treeItems: GitHubTreeItem[],
) {
  const rootBlobPaths = treeItems
    .filter((item) => item.type === "blob" && !item.path.includes("/"))
    .map((item) => item.path);

  const toPrefetch: string[] = [];
  for (const name of COMMON_ENTRY_FILES) {
    if (rootBlobPaths.includes(name)) {
      toPrefetch.push(name);
    }
    if (toPrefetch.length >= 3) break;
  }

  if (toPrefetch.length === 0) {
    toPrefetch.push(...rootBlobPaths.slice(0, 3));
  }

  for (const path of toPrefetch) {
    prefetchFileContent(queryClient, owner, repo, path);
  }
}

export function prefetchRepoCommits(
  queryClient: QueryClient,
  owner: string,
  repo: string,
) {
  queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.repoCommits(owner, repo),
    queryFn: ({ pageParam }) => fetchCommits(owner, repo, pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    pages: 1,
    staleTime: 1000 * 60 * 2,
  });
}

export function prefetchProfile(queryClient: QueryClient) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.user(),
    queryFn: () => fetchAuthenticatedUser(),
    staleTime: 1000 * 60 * 10,
  });
  queryClient.prefetchQuery({
    queryKey: ["socialAccounts"],
    queryFn: fetchSocialAccounts,
    staleTime: 1000 * 60 * 10,
  });
}

export function prefetchOverview(queryClient: QueryClient) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.pinned(),
    queryFn: fetchPinnedRepos,
    staleTime: 1000 * 60 * 15,
  });
  queryClient.prefetchQuery({
    queryKey: queryKeys.contributions(),
    queryFn: fetchContributionGraph,
    staleTime: 1000 * 60 * 15,
  });
}
