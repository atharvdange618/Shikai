import { fetchReceivedEvents } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
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

const PER_PAGE = 30;

export function useReceivedEvents() {
  const pat = useAuthStore((s) => s.pat);
  const user = useAuthStore((s) => s.user);

  const { items: events, ...rest } = useInfinitePagedQuery(
    {
      queryKey: [...queryKeys.receivedEvents(), pat ? "pat" : "oauth"],
      queryFn: ({ pageParam }) =>
        fetchReceivedEvents(user!.login, pageParam, PER_PAGE, pat),
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
    },
    (data) => data?.pages.flatMap((p) => p.events) ?? [],
  );

  return { events, ...rest };
}
