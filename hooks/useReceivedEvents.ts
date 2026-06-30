import { fetchReceivedEvents } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubEventType } from "@/types/github.types";
import { useInfiniteQuery } from "@tanstack/react-query";

const RENDERED_EVENT_TYPES: GitHubEventType[] = [
  "PushEvent",
  "WatchEvent",
  "ForkEvent",
  "CreateEvent",
  "PullRequestEvent",
  "IssuesEvent",
  "ReleaseEvent",
  "PublicEvent",
];

const PER_PAGE = 30;

export function useReceivedEvents() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.receivedEvents(),
    queryFn: ({ pageParam }) => fetchReceivedEvents(pageParam, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 2,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        events: page.events.filter((e) =>
          RENDERED_EVENT_TYPES.includes(e.type),
        ),
      })),
    }),
  });

  return {
    events: query.data?.pages.flatMap((p) => p.events) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
