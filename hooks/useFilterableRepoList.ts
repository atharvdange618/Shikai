import type { QueryKey } from "@tanstack/react-query";

import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { searchRepos } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import type { GitHubPagination, GitHubRepo } from "@/types/github.types";

interface FetchListResult {
  repos: GitHubRepo[];
  pagination: GitHubPagination;
}

interface UseFilterableRepoListOptions {
  listQueryKey: QueryKey;
  fetchList: (page: number, perPage: number) => Promise<FetchListResult>;
  /** Extra search qualifier appended to the query, e.g. "is:starred". */
  searchQualifier?: string;
  search?: string;
  filter?: (repo: GitHubRepo) => boolean;
  perPage?: number;
  staleTime?: number;
}

/**
 * When there's a search query, use GitHub's search API (searches ALL
 * matching repos, case-insensitive). Otherwise use the paginated list
 * endpoint with client-side filtering. Shared by useRepos and useStarred.
 */
export function useFilterableRepoList({
  listQueryKey,
  fetchList,
  searchQualifier = "",
  search,
  filter,
  perPage = 10,
  staleTime = 1000 * 60 * 5,
}: UseFilterableRepoListOptions) {
  const trimmedSearch = search?.trim() ?? "";
  const isSearching = !!trimmedSearch;
  const username = useAuthStore((s) => s.user?.login ?? "");

  const { items: listRepos, ...listRest } = useInfinitePagedQuery<
    FetchListResult,
    GitHubRepo
  >(
    {
      queryKey: listQueryKey,
      queryFn: ({ pageParam }) => fetchList(pageParam, perPage),
      staleTime,
      enabled: !isSearching,
    },
    (data) => data?.pages.flatMap((p) => p.repos) ?? [],
  );

  const searchTerms = [trimmedSearch, `user:${username}`, searchQualifier]
    .filter(Boolean)
    .join(" ");

  const { items: searchReposData, ...searchRest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.searchRepos(searchTerms),
      queryFn: ({ pageParam }) => searchRepos(searchTerms, pageParam, perPage),
      staleTime,
      enabled: isSearching && !!username,
    },
    (data) => data?.pages.flatMap((p) => p.repos) ?? [],
  );

  const activeRest = isSearching ? searchRest : listRest;
  const allRepos = isSearching ? searchReposData : listRepos;

  const clientFiltered = useSearchIndex(listRepos, "", filter);
  const filteredRepos = isSearching
    ? filter
      ? allRepos.filter(filter)
      : allRepos
    : clientFiltered;

  return {
    repos: filteredRepos,
    loadedCount: allRepos.length,
    ...activeRest,
  };
}
