/**
 * Client-side filtering:
 * GitHub's REST API doesn't support filtering by language.
 * We fetch all pages and filter on the client via the `select` option.
 * Type and sort filters ARE passed as query params to the API.
 */

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
  const { sort = "updated", type = "all", language, search } = filters;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.repos(), { sort, type }] as const,

    queryFn: ({ pageParam }) =>
      fetchRepos({
        page: pageParam,
        per_page: PER_PAGE,
        sort,
        type,
      }),

    initialPageParam: 1,

    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,

    staleTime: 1000 * 60 * 5,

    select: (data) => {
      const allRepos = data.pages.flatMap((page) => page.repos);

      const filtered = allRepos.filter((repo: GitHubRepo) => {
        const matchesLanguage =
          !language || repo.language?.toLowerCase() === language.toLowerCase();

        const matchesSearch =
          !search ||
          repo.name.toLowerCase().includes(search.toLowerCase()) ||
          repo.description?.toLowerCase().includes(search.toLowerCase());

        return matchesLanguage && matchesSearch;
      });

      return {
        repos: filtered,
        pageParams: data.pageParams,
        pages: data.pages,
      };
    },
  });

  return {
    repos: query.data?.repos ?? [],

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
