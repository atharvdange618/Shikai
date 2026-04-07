/**
 * Fetches the authenticated user's contribution calendar via GraphQL.
 * This data is not available via REST - GraphQL only.
 *
 * staleTime: 15 minutes. The graph only updates once per day anyway.
 */

import { fetchContributionGraph } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const contributionsQueryOptions = queryOptions({
  queryKey: queryKeys.contributions(),
  queryFn: fetchContributionGraph,
  staleTime: 1000 * 60 * 15,
});

export function useContributions() {
  const query = useQuery(contributionsQueryOptions);

  return {
    weeks: query.data?.weeks ?? [],
    totalContributions: query.data?.totalContributions ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
