import {
  fetchCommitActivity,
  fetchContributorStats,
  fetchPunchCard,
} from "@/lib/github-rest";
import { queryKeys, statsRetry, statsRetryDelay } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

// Stats only change when the default branch moves, so an hour is plenty.
const STATS_STALE_TIME = 1000 * 60 * 60;

export function useCommitActivity(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoCommitActivity(owner, repo),
      queryFn: () => fetchCommitActivity(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: STATS_STALE_TIME,
      retry: statsRetry,
      retryDelay: statsRetryDelay,
    }),
  );
}

export function useContributorStats(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoContributorStats(owner, repo),
      queryFn: () => fetchContributorStats(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: STATS_STALE_TIME,
      retry: statsRetry,
      retryDelay: statsRetryDelay,
    }),
  );
}

export function usePunchCard(owner: string, repo: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoPunchCard(owner, repo),
      queryFn: () => fetchPunchCard(owner, repo),
      enabled: Boolean(owner && repo),
      staleTime: STATS_STALE_TIME,
      retry: statsRetry,
      retryDelay: statsRetryDelay,
    }),
  );
}
