import {
  fetchIssueComments,
  fetchIssueTimelinePage,
  fetchCheckRuns,
  fetchCombinedStatus,
  fetchPullRequestCommits,
  fetchPullRequestDetail,
  fetchPullRequestFiles,
  fetchPullRequestReviewComments,
  fetchPullRequestReviews,
  fetchRequestedReviewers,
} from "@/lib/github-rest";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";
import { queryKeys } from "@/lib/query-client";
import type { GitHubCheckConclusion, GitHubCheckStatus } from "@/types/github.types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function usePullRequestConversation(owner: string, repo: string, number: number) {
  return useInfinitePagedQuery(
    {
      queryKey: [...queryKeys.prDetail(owner, repo, number), "conversation"],
      queryFn: ({ pageParam }) => fetchIssueComments(owner, repo, number, pageParam, 100),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.comments) ?? [],
  );
}

export function usePullRequestActivity(owner: string, repo: string, number: number) {
  return useInfinitePagedQuery(
    {
      queryKey: [...queryKeys.prDetail(owner, repo, number), "activity"],
      queryFn: ({ pageParam }) => fetchIssueTimelinePage(owner, repo, number, pageParam),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.events) ?? [],
  );
}

export function usePullRequestDetail(owner: string, repo: string, number: number) {
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

export function usePullRequestReviewComments(owner: string, repo: string, number: number) {
  const query = useInfinitePagedQuery(
    {
      queryKey: queryKeys.prReviewComments(owner, repo, number),
      queryFn: ({ pageParam }) => fetchPullRequestReviewComments(owner, repo, number, pageParam),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.comments) ?? [],
  );
  return { ...query, comments: query.items };
}

const FILES_PER_PAGE = 100;

export function usePullRequestFiles(owner: string, repo: string, number: number) {
  const { items: files, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.prFiles(owner, repo, number),
      queryFn: ({ pageParam }) =>
        fetchPullRequestFiles(owner, repo, number, pageParam, FILES_PER_PAGE),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((p) => p.files) ?? [],
  );

  return { files, ...rest };
}

/**
 * One file from the PR's changed files. A diff link can name a file past the
 * first page, so this keeps loading pages until the file turns up or the
 * pages run out, and reports loading until then.
 */
export function usePullRequestFile(owner: string, repo: string, number: number, filename: string) {
  const query = usePullRequestFiles(owner, repo, number);
  const { files, hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  const file = files.find((f) => f.filename === filename);
  const searching = !file && hasNextPage && !isError;

  useEffect(() => {
    if (searching && !isFetchingNextPage) void fetchNextPage();
  }, [searching, isFetchingNextPage, fetchNextPage]);

  return {
    ...query,
    file,
    isLoading: query.isLoading || searching,
    isError: query.isError && !file,
  };
}

export function usePullRequestReviews(owner: string, repo: string, number: number) {
  const query = useInfinitePagedQuery(
    {
      queryKey: queryKeys.prReviews(owner, repo, number),
      queryFn: ({ pageParam }) => fetchPullRequestReviews(owner, repo, number, pageParam),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.reviews) ?? [],
  );
  return { ...query, reviews: query.items };
}

export function useRequestedReviewers(owner: string, repo: string, number: number) {
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

export function usePullRequestCommits(owner: string, repo: string, number: number) {
  const query = useInfinitePagedQuery(
    {
      queryKey: queryKeys.prCommits(owner, repo, number),
      queryFn: ({ pageParam }) => fetchPullRequestCommits(owner, repo, number, pageParam),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.commits) ?? [],
  );
  return { ...query, commits: query.items };
}

export interface CheckSummaryItem {
  key: string;
  name: string;
  conclusion: GitHubCheckConclusion | "pending" | "error";
  url: string | null;
  runId?: number;
  /** Raw run state, so a row can carry the same status icon as the Actions list. */
  status: GitHubCheckStatus;
  /** App that reported the run, e.g. `GitHub Actions`. Unknown for legacy statuses. */
  app?: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export function useChecks(owner: string, repo: string, ref: string) {
  const runs = useInfinitePagedQuery(
    {
      queryKey: [...queryKeys.commitChecks(owner, repo, ref), "runs"],
      queryFn: ({ pageParam }) => fetchCheckRuns(owner, repo, ref, pageParam),
      enabled: Boolean(owner && repo && ref),
      staleTime: 1000 * 30,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.runs) ?? [],
  );
  const statuses = useInfinitePagedQuery(
    {
      queryKey: [...queryKeys.commitChecks(owner, repo, ref), "statuses"],
      queryFn: ({ pageParam }) => fetchCombinedStatus(owner, repo, ref, pageParam),
      enabled: Boolean(owner && repo && ref),
      staleTime: 1000 * 30,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.statuses) ?? [],
  );
  const fromCheckRuns: CheckSummaryItem[] = runs.items.map((run) => ({
    key: `check-${run.id}`,
    name: run.name,
    conclusion: run.status === "completed" ? run.conclusion : "pending",
    url: run.html_url,
    runId: run.id,
    status: run.status,
    app: run.app?.name ?? null,
    startedAt: run.started_at || null,
    completedAt: run.completed_at,
  }));

  const fromStatuses: CheckSummaryItem[] = statuses.items.map((status) => ({
    key: `status-${status.context}`,
    name: status.context,
    conclusion:
      status.state === "success"
        ? "success"
        : status.state === "failure" || status.state === "error"
          ? status.state
          : "pending",
    url: status.target_url,
    status: status.state === "pending" ? "in_progress" : "completed",
    startedAt: status.created_at || null,
    completedAt: status.updated_at,
  }));

  return {
    data: [
      ...new Map([...fromCheckRuns, ...fromStatuses].map((check) => [check.key, check])).values(),
    ],
    total:
      runs.data && statuses.data
        ? (runs.data.pages[0]?.total ?? 0) + (statuses.data.pages[0]?.total_count ?? 0)
        : undefined,
    isLoading: runs.isLoading || statuses.isLoading,
    isError: runs.isError || statuses.isError,
    hasNextPage: runs.hasNextPage || statuses.hasNextPage,
    isFetchingNextPage: runs.isFetchingNextPage || statuses.isFetchingNextPage,
    fetchNextPage: () =>
      Promise.all([
        runs.hasNextPage ? runs.fetchNextPage() : runs.isError ? runs.refetch() : undefined,
        statuses.hasNextPage
          ? statuses.fetchNextPage()
          : statuses.isError
            ? statuses.refetch()
            : undefined,
      ]),
    refetch: () => Promise.all([runs.refetch(), statuses.refetch()]),
  };
}
