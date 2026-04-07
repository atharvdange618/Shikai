import { fetchUserEvents } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubEvent, GitHubEventType } from "@/types/github.types";
import { queryOptions, useQuery } from "@tanstack/react-query";

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

export function useEvents(username: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.events(username),
      queryFn: () => fetchUserEvents(username),
      enabled: Boolean(username),
      staleTime: 1000 * 60 * 1,

      select: (events: GitHubEvent[]) =>
        events.filter((e) => RENDERED_EVENT_TYPES.includes(e.type)),
    }),
  );
}
