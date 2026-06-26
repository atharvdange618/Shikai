import {
  fetchPullRequestComments,
  fetchPullRequestDetail,
} from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
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
    }),
  );
}

export function usePullRequestComments(
  owner: string,
  repo: string,
  number: number,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.prComments(owner, repo, number),
      queryFn: () => fetchPullRequestComments(owner, repo, number),
      enabled: Boolean(owner && repo && number),
      staleTime: 1000 * 60 * 2,
    }),
  );
}
