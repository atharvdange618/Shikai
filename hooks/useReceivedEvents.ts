import { fetchReceivedEvents } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
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
  const pat = useAuthStore((s) => s.pat);
  const user = useAuthStore((s) => s.user);

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.receivedEvents(), pat ? "pat" : "oauth"],
    queryFn: ({ pageParam }) =>
      fetchReceivedEvents(user!.login, pageParam, PER_PAGE, pat),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(user?.login),
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        events: page.events.filter(
          (e) =>
            RENDERED_EVENT_TYPES.includes(e.type) &&
            e.actor.login !== user?.login,
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
