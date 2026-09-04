import { fetchComparison } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export function useComparison(
  owner: string,
  repo: string,
  base: string,
  head: string,
) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.comparison(owner, repo, base, head),
      queryFn: () => fetchComparison(owner, repo, base, head),
      enabled: Boolean(owner && repo && base && head),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    }),
  );
}
