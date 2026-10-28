import { fetchForks, fetchStargazers } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import {
  flattenItems,
  PAGED_LIST_STALE_TIME,
  useInfinitePagedQuery,
} from "@/hooks/useInfinitePagedQuery";

export function useStargazers(owner: string, repo: string) {
  const pat = useAuthStore((s) => s.pat);

  const { items: users, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.repoStargazers(owner, repo),
      queryFn: ({ pageParam }) =>
        fetchStargazers(owner, repo, pageParam, pat),
      enabled: Boolean(owner && repo && pat),
      staleTime: PAGED_LIST_STALE_TIME,
    },
    flattenItems,
  );

  return { users, ...rest };
}

export function useForks(owner: string, repo: string) {
  const { items: forks, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.repoForks(owner, repo),
      queryFn: ({ pageParam }) => fetchForks(owner, repo, pageParam),
      enabled: Boolean(owner && repo),
      staleTime: PAGED_LIST_STALE_TIME,
    },
    flattenItems,
  );

  return { forks, ...rest };
}
