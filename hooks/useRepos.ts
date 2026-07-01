/**
 * When there's a search query, use GitHub's search API (searches ALL repos,
 * case-insensitive). Otherwise, use the paginated /user/repos endpoint
 * with client-side language/type filtering.
 */

import { useMemo } from "react";

import { useSearchIndex } from "@/hooks/useSearchIndex";
import { fetchRepos, searchRepos } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import type { GitHubRepo, RepoListParams } from "@/types/github.types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PER_PAGE = 10;

export interface RepoFilters {
  sort?: RepoListParams["sort"];
  type?: RepoListParams["type"];
  language?: string;
  search?: string;
}

export function useRepos(filters: RepoFilters = {}) {
  const { sort = "pushed", type, language, search } = filters;
  const trimmedSearch = search?.trim() ?? "";
  const username = useAuthStore((s) => s.user?.login ?? "");

  const apiType = type === "forks" ? "all" : type;

  const listQuery = useInfiniteQuery({
    queryKey: [...queryKeys.repos(), { sort, type: apiType }] as const,

    queryFn: ({ pageParam }) =>
      fetchRepos({
        page: pageParam,
        per_page: PER_PAGE,
        sort,
        type: apiType,
      }),

    initialPageParam: 1,

    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,

    staleTime: 1000 * 60 * 5,

    select: (data) => {
      return data.pages.flatMap((page) => page.repos);
    },

    enabled: !trimmedSearch,
  });

  const searchQuery = useInfiniteQuery({
    queryKey: queryKeys.searchRepos(`${trimmedSearch} user:${username}`),
    queryFn: ({ pageParam }) =>
      searchRepos(`${trimmedSearch} user:${username}`, pageParam, PER_PAGE),
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

  const typeFilter = useMemo(() => {
    if (type === "forks") return (repo: GitHubRepo) => repo.fork === true;
    return undefined;
  }, [type]);

  const combinedFilter = useMemo(() => {
    if (!languageFilter && !typeFilter) return undefined;
    return (repo: GitHubRepo) =>
      (!languageFilter || languageFilter(repo)) &&
      (!typeFilter || typeFilter(repo));
  }, [languageFilter, typeFilter]);

  const isSearching = !!trimmedSearch;
  const activeQuery = isSearching ? searchQuery : listQuery;

  const listRepos = listQuery.data ?? [];
  const searchReposData = searchQuery.data?.pages.flatMap((p) => p.repos) ?? [];
  const allRepos = isSearching ? searchReposData : listRepos;

  // When not searching, apply client-side language/type filter via useSearchIndex.
  // When searching, the API already handled the query; just apply extra filters.
  const clientFiltered = useSearchIndex(listRepos, "", combinedFilter);
  const filteredRepos = isSearching
    ? combinedFilter
      ? allRepos.filter(combinedFilter)
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

export function useRepoLanguageOptions(): string[] {
  const { repos } = useRepos();

  const languages = repos
    .map((r) => r.language)
    .filter((lang): lang is string => lang !== null);

  return Array.from(new Set(languages)).sort();
}
