import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { fetchGist, fetchGists } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";

const PER_PAGE = 30;

export function useGists(username: string, isSelf: boolean) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.gists(username),
    queryFn: ({ pageParam }) =>
      fetchGists(username, isSelf, pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 5,
  });

  return {
    gists: query.data?.pages.flatMap((p) => p.gists) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useGist(id: string) {
  return useQuery({
    queryKey: queryKeys.gist(id),
    queryFn: () => fetchGist(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}
