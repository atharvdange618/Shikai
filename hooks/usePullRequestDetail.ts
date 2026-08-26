import {
  fetchCheckRuns,
  fetchCombinedStatus,
  fetchPullRequestCommits,
  fetchPullRequestDetail,
  fetchPullRequestFiles,
  fetchPullRequestReviewComments,
  fetchPullRequestReviews,
  fetchRequestedReviewers,
} from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubCheckConclusion } from "@/types/github.types";
import { queryOptions, useQuery } from "@tanstack/react-query";

export function usePullRequestDetail(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.prDetail(owner, repo, number),
      queryFn: () => fetchPullRequestDetail(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}

export function usePullRequestReviewComments(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.prReviewComments(owner, repo, number),
      queryFn: () => fetchPullRequestReviewComments(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}

export function usePullRequestFiles(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.prFiles(owner, repo, number),
      queryFn: () => fetchPullRequestFiles(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}

export function usePullRequestReviews(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.prReviews(owner, repo, number),
      queryFn: () => fetchPullRequestReviews(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}

export function useRequestedReviewers(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.prRequestedReviewers(owner, repo, number),
      queryFn: () => fetchRequestedReviewers(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}

export function usePullRequestCommits(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.prCommits(owner, repo, number),
      queryFn: () => fetchPullRequestCommits(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}

export interface CheckSummaryItem {
  key: string;
  name: string;
  conclusion: GitHubCheckConclusion | "pending" | "error";
  url: string | null;
}

// Merges GitHub Actions check-runs with legacy commit statuses (Vercel,
// Netlify, and other external CI still report through the older API), since
// GitHub's own PR page treats both as one "checks" list.
export function useChecks(owner: string, repo: string, ref: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.commitChecks(owner, repo, ref),
      queryFn: async (): Promise<CheckSummaryItem[]> => {
        const [checkRuns, combinedStatus] = await Promise.all([
          fetchCheckRuns(owner, repo, ref),
          fetchCombinedStatus(owner, repo, ref),
        ]);

        const fromCheckRuns: CheckSummaryItem[] = checkRuns.map((run) => ({
          key: `check-${run.id}`,
          name: run.name,
          conclusion: run.status === "completed" ? run.conclusion : "pending",
          url: run.html_url,
        }));

        const fromStatuses: CheckSummaryItem[] = combinedStatus.statuses.map(
          (status) => ({
            key: `status-${status.context}`,
            name: status.context,
            conclusion:
              status.state === "success"
                ? "success"
                : status.state === "failure" || status.state === "error"
                  ? "failure"
                  : "pending",
            url: status.target_url,
          }),
        );

        return [...fromCheckRuns, ...fromStatuses];
      },
      enabled: Boolean(owner && repo && ref),
      staleTime: 1000 * 30,
      meta: { persist: false },
    }),
  );
}
