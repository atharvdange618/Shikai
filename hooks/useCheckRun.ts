import { fetchCheckRun, fetchCheckRunAnnotations } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export function useCheckRun(owner: string, repo: string, runId: number) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.checkRun(owner, repo, runId),
      queryFn: () => fetchCheckRun(owner, repo, runId),
      enabled: Boolean(owner && repo && runId),
      staleTime: 1000 * 30,
      meta: { persist: false },
    }),
  );
}

export function useCheckRunAnnotations(
  owner: string,
  repo: string,
  runId: number,
  hasAnnotations: boolean,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.checkRunAnnotations(owner, repo, runId),
      queryFn: () => fetchCheckRunAnnotations(owner, repo, runId),
      enabled: Boolean(owner && repo && runId) && hasAnnotations,
      staleTime: 1000 * 30,
      meta: { persist: false },
    }),
  );
}
