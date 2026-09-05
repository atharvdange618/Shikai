import { fetchUserEvents } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";
import type { GitHubEventType } from "@/types/github.types";

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

const PER_PAGE = 20;

export function useEvents(username: string) {
  const { items: events, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.events(username),
      queryFn: ({ pageParam }) =>
        fetchUserEvents(username, pageParam, PER_PAGE),
      enabled: Boolean(username),
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
    },
    (data) => data?.pages.flatMap((p) => p.events) ?? [],
  );

  return { events, ...rest };
}
