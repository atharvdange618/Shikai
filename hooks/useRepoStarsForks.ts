import { fetchForks, fetchStargazers } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";

export function useStargazers(owner: string, repo: string) {
  const pat = useAuthStore((s) => s.pat);

  const { items: users, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.repoStargazers(owner, repo),
      queryFn: ({ pageParam }) =>
        fetchStargazers(owner, repo, pageParam, pat ?? ""),
      enabled: Boolean(owner && repo && pat),
      staleTime: 1000 * 60 * 5,
    },
    (data) => data?.pages.flatMap((p) => p.items) ?? [],
  );

  return { users, ...rest };
}

export function useForks(owner: string, repo: string) {
  const { items: forks, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.repoForks(owner, repo),
      queryFn: ({ pageParam }) => fetchForks(owner, repo, pageParam),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 5,
    },
    (data) => data?.pages.flatMap((p) => p.items) ?? [],
  );

  return { forks, ...rest };
}
