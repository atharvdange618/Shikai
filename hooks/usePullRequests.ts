import { fetchPullRequests } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfiniteQuery } from "@tanstack/react-query";

const PER_PAGE = 15;

export function usePullRequests(
  owner: string,
  repo: string,
  state: "open" | "closed" = "open",
) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.repoPullRequests(owner, repo, state),
    queryFn: ({ pageParam }) =>
      fetchPullRequests(owner, repo, pageParam, PER_PAGE, state),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    enabled: Boolean(owner && repo),
    staleTime: 1000 * 60 * 2,
  });

  return {
    pullRequests: query.data?.pages.flatMap((p) => p.pullRequests) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
