import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  searchIssues,
  searchRepos,
  searchUsers,
} from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";

const PER_PAGE = 10;

export type SearchTab = "repos" | "users" | "issues";

interface UseGlobalSearchOptions {
  query: string;
  tab: SearchTab;
  enabled?: boolean;
}

export function useGlobalSearch({ query, tab, enabled = true }: UseGlobalSearchOptions) {
  const trimmedQuery = query.trim();

  const reposQuery = useInfiniteQuery({
    queryKey: queryKeys.searchRepos(trimmedQuery),
    queryFn: ({ pageParam }) => searchRepos(trimmedQuery, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 5,
    enabled: enabled && tab === "repos" && trimmedQuery.length > 0,
  });

  const usersQuery = useInfiniteQuery({
    queryKey: queryKeys.searchUsers(trimmedQuery),
    queryFn: ({ pageParam }) => searchUsers(trimmedQuery, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 5,
    enabled: enabled && tab === "users" && trimmedQuery.length > 0,
  });

  const issuesQuery = useInfiniteQuery({
    queryKey: queryKeys.searchIssues(trimmedQuery),
    queryFn: ({ pageParam }) => searchIssues(trimmedQuery, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 5,
    enabled: enabled && tab === "issues" && trimmedQuery.length > 0,
  });

  const activeQuery = tab === "repos" ? reposQuery : tab === "users" ? usersQuery : issuesQuery;

  const repos = useMemo(
    () => reposQuery.data?.pages.flatMap((p) => p.repos) ?? [],
    [reposQuery.data],
  );

  const users = useMemo(
    () => usersQuery.data?.pages.flatMap((p) => p.users) ?? [],
    [usersQuery.data],
  );

  const issues = useMemo(
    () => issuesQuery.data?.pages.flatMap((p) => p.issues) ?? [],
    [issuesQuery.data],
  );

  return {
    repos,
    users,
    issues,
    totalCount: activeQuery.data?.pages[0]?.totalCount ?? 0,
    fetchNextPage: activeQuery.fetchNextPage,
    hasNextPage: activeQuery.hasNextPage,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    error: activeQuery.error,
  };
}
