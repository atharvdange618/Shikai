import { fetchIssue, fetchIssueComments } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export function useIssueDetail(owner: string, repo: string, number: number) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.issueDetail(owner, repo, number),
      queryFn: () => fetchIssue(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}

export function useIssueComments(owner: string, repo: string, number: number) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.issueComments(owner, repo, number),
      queryFn: () => fetchIssueComments(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}
