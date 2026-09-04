import { fetchReleaseByTag, fetchReleases } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

const PER_PAGE = 20;

export function useReleases(owner: string, repo: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.repoReleases(owner, repo),
    queryFn: ({ pageParam }) =>
      fetchReleases(owner, repo, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    enabled: Boolean(owner && repo),
    staleTime: 1000 * 60 * 5,
  });

  return {
    releases: query.data?.pages.flatMap((p) => p.releases) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useRelease(owner: string, repo: string, tag: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoRelease(owner, repo, tag),
      queryFn: () => fetchReleaseByTag(owner, repo, tag),
      enabled: Boolean(owner && repo && tag),
      staleTime: 1000 * 60 * 5,
      meta: { persist: false },
    }),
  );
}
