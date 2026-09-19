import {
  fetchDiscussion,
  fetchDiscussions,
  fetchMoreDiscussionReplies,
} from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import type { DiscussionDetail } from "@/types/github-graphql.types";
import {
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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

export function useLoadMoreReplies(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.discussionDetail(owner, repo, number);

  return useMutation({
    mutationFn: ({
      commentId,
      after,
    }: {
      commentId: string;
      after: string | null;
    }) => fetchMoreDiscussionReplies(commentId, after),
    onSuccess: (result, { commentId }) => {
      if (!result) return;
      queryClient.setQueryData<DiscussionDetail | null>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          comments: {
            ...old.comments,
            nodes: old.comments.nodes.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    replies: {
                      ...comment.replies,
                      pageInfo: result.replies.pageInfo,
                      nodes: [...comment.replies.nodes, ...result.replies.nodes],
                    },
                  }
                : comment,
            ),
          },
        };
      });
    },
  });
}
