/**
 * When there's a search query, use GitHub's search API with `is:starred`
 * (searches ALL starred repos, case-insensitive). Otherwise, use the
 * paginated /user/starred endpoint with client-side language filtering.
 */

import { useMemo } from "react";

import { useSearchIndex } from "@/hooks/useSearchIndex";
import { fetchStarred, searchRepos } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import type { GitHubRepo, RepoListParams } from "@/types/github.types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PER_PAGE = 10;

export interface StarredFilters {
  sort?: NonNullable<RepoListParams["sort"]>;
  language?: string;
  search?: string;
}

export function useStarred(filters: StarredFilters = {}) {
  const { sort = "created", language, search } = filters;
  const trimmedSearch = search?.trim() ?? "";
  const username = useAuthStore((s) => s.user?.login ?? "");

  const listQuery = useInfiniteQuery({
    queryKey: [...queryKeys.starred(), { sort }] as const,

    queryFn: ({ pageParam }) => fetchStarred(pageParam, PER_PAGE, sort),

    initialPageParam: 1,

    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,

    staleTime: 1000 * 60 * 5,

    select: (data) => {
      return data.pages.flatMap((page) => page.repos);
    },

    enabled: !trimmedSearch,
  });

  const searchQuery = useInfiniteQuery({
    queryKey: queryKeys.searchRepos(`${trimmedSearch} user:${username} is:starred`),
    queryFn: ({ pageParam }) =>
      searchRepos(`${trimmedSearch} user:${username} is:starred`, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 5,
    enabled: !!trimmedSearch && !!username,
  });

  const languageFilter = useMemo(() => {
    if (!language) return undefined;
    return (repo: GitHubRepo) =>
      repo.language?.toLowerCase() === language.toLowerCase();
  }, [language]);

  const isSearching = !!trimmedSearch;
  const activeQuery = isSearching ? searchQuery : listQuery;

  const listRepos = listQuery.data ?? [];
  const searchReposData = searchQuery.data?.pages.flatMap((p) => p.repos) ?? [];
  const allRepos = isSearching ? searchReposData : listRepos;

  const clientFiltered = useSearchIndex(listRepos, "", languageFilter);
  const filteredRepos = isSearching
    ? languageFilter
      ? allRepos.filter(languageFilter)
      : allRepos
    : clientFiltered;

  return {
    repos: filteredRepos,
    loadedCount: allRepos.length,
    fetchNextPage: activeQuery.fetchNextPage,
    hasNextPage: activeQuery.hasNextPage,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    error: activeQuery.error,
    isFetching: activeQuery.isFetching,
    refetch: activeQuery.refetch,
  };
}

export function useStarredLanguageOptions(): string[] {
  const { repos } = useStarred();

  const languages = repos
    .map((r) => r.language)
    .filter((lang): lang is string => lang !== null);

  return Array.from(new Set(languages)).sort();
}
