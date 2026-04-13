/**
 * Why separate hooks instead of one big hook?
 * Each piece of data has a different staleTime and loading state.
 * The README is big and slow - it shouldn't block the stats from showing.
 * The file tree is only fetched when the user opens the code panel.
 * Splitting them means each query loads independently and the screen
 * progressively fills in rather than waiting for everything at once.
 */

import { fetchCommitCount, fetchRepoIssuesPRStats } from "@/lib/github-graphql";
import {
  fetchCommits,
  fetchContributors,
  fetchFileContent,
  fetchFileTree,
  fetchLanguages,
  fetchLastCommit,
  fetchReadme,
  fetchRepo,
} from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubLanguages, LanguageShare } from "@/types/github.types";
import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

import languageColors from "@/constants/language-colors.json";

const PER_PAGE = 10;

export function useRepo(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repo(owner, repo),
      queryFn: () => fetchRepo(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 5,
    }),
  );
}

export function useRepoLanguages(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoLanguages(owner, repo),
      queryFn: () => fetchLanguages(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 10,

      select: (langs: GitHubLanguages): LanguageShare[] => {
        const total = Object.values(langs).reduce((sum, b) => sum + b, 0);
        if (total === 0) return [];

        return Object.entries(langs)
          .map(([name, bytes]) => ({
            name,
            bytes,
            percentage: Math.round((bytes / total) * 1000) / 10,
            color:
              (languageColors as Record<string, { color: string | null }>)[name]
                ?.color ?? "#8B949E",
          }))
          .sort((a, b) => b.bytes - a.bytes);
      },
    }),
  );
}

export function useCommitCount(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoCommitCount(owner, repo),
      queryFn: () => fetchCommitCount(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 5,
    }),
  );
}

export function useLastCommit(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoLastCommit(owner, repo),
      queryFn: () => fetchLastCommit(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 2,
    }),
  );
}

export function useCommits(owner: string, repo: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.repoCommits(owner, repo),

    queryFn: ({ pageParam }) => fetchCommits(owner, repo, pageParam, PER_PAGE),

    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,

    enabled: Boolean(owner && repo),
    staleTime: 1000 * 60 * 2,
  });

  return {
    commits: query.data?.pages.flatMap((p) => p.commits) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useContributors(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoContributors(owner, repo),
      queryFn: () => fetchContributors(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 10,
    }),
  );
}

export function useFileTree(
  owner: string,
  repo: string,
  branch: string,
  open: boolean,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoFileTree(owner, repo),
      queryFn: () => fetchFileTree(owner, repo, branch),
      enabled: Boolean(owner && repo && branch && open),
      staleTime: 1000 * 60 * 15,
    }),
  );
}

export function useFileContent(
  owner: string,
  repo: string,
  path: string,
  enabled: boolean = false,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoFile(owner, repo, path),
      queryFn: () => fetchFileContent(owner, repo, path),
      enabled: Boolean(owner && repo && path && enabled),
      staleTime: 1000 * 60 * 15,
    }),
  );
}

export function useReadme(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoReadme(owner, repo),
      queryFn: () => fetchReadme(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 10,
      retry: (failureCount, error: unknown) => {
        if (error instanceof Error && error.message.includes("404"))
          return false;
        return failureCount < 2;
      },
    }),
  );
}

export function useRepoDetailsScreen(owner: string, repo: string) {
  const repoQuery = useRepo(owner, repo);
  const languagesQuery = useRepoLanguages(owner, repo);
  const commitCountQuery = useCommitCount(owner, repo);
  const lastCommitQuery = useLastCommit(owner, repo);
  const issuesPRStatsQuery = useRepoIssuesPRStats(owner, repo);
  const contributorsQuery = useContributors(owner, repo);
  const readmeQuery = useReadme(owner, repo);

  const isCoreLoading =
    repoQuery.isLoading ||
    languagesQuery.isLoading ||
    lastCommitQuery.isLoading;

  return {
    repo: repoQuery.data,
    languages: languagesQuery.data ?? [],
    commitCount: commitCountQuery.data ?? null,
    lastCommit: lastCommitQuery.data,
    issuesPRStats: issuesPRStatsQuery.data ?? null,
    contributors: contributorsQuery.data ?? [],
    readme: readmeQuery.data,
    isLoading: {
      core: isCoreLoading,
      commitCount: commitCountQuery.isLoading,
      contributors: contributorsQuery.isLoading,
      readme: readmeQuery.isLoading,
    },

    isError: repoQuery.isError,
    error: repoQuery.error,
    refetch: repoQuery.refetch,
  };
}

export function useRepoIssuesPRStats(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoIssuesPRStats(owner, repo),
      queryFn: () => fetchRepoIssuesPRStats(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 5,
    }),
  );
}
