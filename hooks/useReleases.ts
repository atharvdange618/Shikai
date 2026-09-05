import { fetchReleaseByTag, fetchReleases } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";
import { queryOptions, useQuery } from "@tanstack/react-query";

const PER_PAGE = 20;

export function useReleases(owner: string, repo: string) {
  const { items: releases, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.repoReleases(owner, repo),
      queryFn: ({ pageParam }) =>
        fetchReleases(owner, repo, pageParam, PER_PAGE),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 5,
    },
    (data) => data?.pages.flatMap((p) => p.releases) ?? [],
  );

  return { releases, ...rest };
}

export function useRelease(owner: string, repo: string, tag: string) {
  return useQuery(
    queryOptions({
      queryKey: queryKeys.repoRelease(owner, repo, tag),
      queryFn: () => fetchReleaseByTag(owner, repo, tag),
      enabled: Boolean(owner && repo && tag),
      staleTime: 1000 * 60 * 5,
      meta: { persist: false },
    }),
  );
}
