import { fetchIssues } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfiniteQuery } from "@tanstack/react-query";

const PER_PAGE = 15;

export function useIssues(
  owner: string,
  repo: string,
  state: "open" | "closed" = "open",
) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.repoIssues(owner, repo, state),
    queryFn: ({ pageParam }) =>
      fetchIssues(owner, repo, pageParam, PER_PAGE, state),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    enabled: Boolean(owner && repo),
    staleTime: 1000 * 60 * 2,
  });

  return {
    issues: query.data?.pages.flatMap((p) => p.issues) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
