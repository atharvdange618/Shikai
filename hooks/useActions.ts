import { fetchWorkflowRun, fetchWorkflowRunJobs, fetchWorkflowRuns } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";
import { queryOptions, useQuery } from "@tanstack/react-query";

const PER_PAGE = 20;

export function useWorkflowRuns(owner: string, repo: string) {
  const { items: runs, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.workflowRuns(owner, repo),
      queryFn: ({ pageParam }) => fetchWorkflowRuns(owner, repo, pageParam, PER_PAGE),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60,
    },
    (data) => data?.pages.flatMap((p) => p.runs) ?? [],
  );

  return { runs, ...rest };
}

export function useWorkflowRun(owner: string, repo: string, runId: number, attempt?: number) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.workflowRun(owner, repo, runId, attempt),
      queryFn: () => fetchWorkflowRun(owner, repo, runId, attempt),
      enabled: Boolean(owner && repo && runId),
      staleTime: 1000 * 30,
      meta: { persist: false },
    }),
  );
}

export function useWorkflowRunJobs(owner: string, repo: string, runId: number, attempt?: number) {
  return useInfinitePagedQuery(
    {
      queryKey: queryKeys.workflowRunJobs(owner, repo, runId, attempt),
      queryFn: ({ pageParam }) => fetchWorkflowRunJobs(owner, repo, runId, attempt ?? 1, pageParam),
      enabled: Boolean(owner && repo && runId && attempt),
      staleTime: 1000 * 30,
      meta: { persist: false },
    },
    (data) => data?.pages.flatMap((page) => page.jobs) ?? [],
  );
}
