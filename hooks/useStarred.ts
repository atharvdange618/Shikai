/**
 * Client-side search + language filter applied via `select`,
 * same reasoning as useRepos: GitHub's API doesn't support these as
 * query params on the starred endpoint.
 */

import { useMemo } from "react";

import { useSearchIndex } from "@/hooks/useSearchIndex";
import { fetchStarred } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubRepo } from "@/types/github.types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PER_PAGE = 10;

import type { RepoListParams } from "@/types/github.types";

export interface StarredFilters {
  sort?: NonNullable<RepoListParams["sort"]>;
  language?: string;
  search?: string;
}

export function useStarred(filters: StarredFilters = {}) {
  const { sort = "created", language, search } = filters;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.starred(), { sort }] as const,

    queryFn: ({ pageParam }) => fetchStarred(pageParam, PER_PAGE, sort),

    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,

    staleTime: 1000 * 60 * 5,

    select: (data) => {
      return data.pages.flatMap((page) => page.repos);
    },
  });

  const languageFilter = useMemo(() => {
    if (!language) return undefined;
    return (repo: GitHubRepo) =>
      repo.language?.toLowerCase() === language.toLowerCase();
  }, [language]);

  const allRepos = query.data ?? [];
  const filteredRepos = useSearchIndex(allRepos, search ?? "", languageFilter);

  return {
    repos: filteredRepos,
    loadedCount: allRepos.length,
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

export function useStarredLanguageOptions(): string[] {
  const { repos } = useStarred();

  const languages = repos
    .map((r) => r.language)
    .filter((lang): lang is string => lang !== null);

  return Array.from(new Set(languages)).sort();
}
