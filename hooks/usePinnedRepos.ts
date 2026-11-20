import { fetchPinnedRepos } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const pinnedReposQueryOptions = queryOptions({
  queryKey: queryKeys.pinned(),
  queryFn: fetchPinnedRepos,
  staleTime: 1000 * 60 * 15,
});

export function usePinnedRepos() {
  return useQuery(pinnedReposQueryOptions);
}
