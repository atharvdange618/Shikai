import { fetchRepoCount } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const repoCountQueryOptions = queryOptions({
  queryKey: queryKeys.repoCount(),
  queryFn: fetchRepoCount,
  staleTime: 1000 * 60 * 30,
});

export function useRepoCount() {
  return useQuery(repoCountQueryOptions);
}
