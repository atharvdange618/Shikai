import { fetchCommit } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export function useCommitDetail(owner: string, repo: string, sha: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.commitDetail(owner, repo, sha),
      queryFn: () => fetchCommit(owner, repo, sha),
      enabled: Boolean(owner && repo && sha),
      // A commit's diff never changes once it exists.
      staleTime: 1000 * 60 * 60,
      meta: { persist: false },
    }),
  );
}
