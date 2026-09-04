import { fetchBlame } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export function useBlame(
  owner: string,
  repo: string,
  ref: string,
  path: string,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.blame(owner, repo, ref, path),
      queryFn: () => fetchBlame(owner, repo, ref, path),
      enabled: Boolean(owner && repo && ref && path),
      staleTime: 1000 * 60 * 10,
      meta: { persist: false },
    }),
  );
}
