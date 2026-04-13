/**
 * Client-side filtering:
 * GitHub's REST API doesn't support filtering by language.
 * Type and sort filters ARE passed as query params to the API.
 */

import { useMemo } from "react";

import { fetchRepos } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
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

  const apiType = type === "forks" ? "all" : type;

  const query = useInfiniteQuery({
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
  });

  const filteredRepos = useMemo(() => {
    const allRepos = query.data ?? [];

    return allRepos.filter((repo: GitHubRepo) => {
      const matchesLanguage =
        !language || repo.language?.toLowerCase() === language.toLowerCase();

      const trimmedSearch = search?.trim();
      const matchesSearch =
        !trimmedSearch ||
        repo.name.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
        repo.description?.toLowerCase().includes(trimmedSearch.toLowerCase());

      const matchesType = type === "forks" ? repo.fork === true : true;

      return matchesLanguage && matchesSearch && matchesType;
    });
  }, [query.data, language, search, type]);

  return {
    repos: filteredRepos,

    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,

    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useRepoLanguageOptions(): string[] {
  const { repos } = useRepos();

  const languages = repos
    .map((r) => r.language)
    .filter((lang): lang is string => lang !== null);

  return Array.from(new Set(languages)).sort();
}
