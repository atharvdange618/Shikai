import { fetchDiscussion, fetchDiscussions } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";

export function useDiscussions(owner: string, repo: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.repoDiscussions(owner, repo),
    queryFn: ({ pageParam }) => fetchDiscussions(owner, repo, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
    enabled: Boolean(owner && repo),
    staleTime: 1000 * 60 * 2,
    meta: { persist: false },
  });

  return {
    discussions: query.data?.pages.flatMap((p) => p.discussions) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useDiscussionDetail(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.discussionDetail(owner, repo, number),
      queryFn: () => fetchDiscussion(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}
