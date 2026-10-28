import { fetchFollowers, fetchFollowing } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import {
  flattenItems,
  PAGED_LIST_STALE_TIME,
  useInfinitePagedQuery,
} from "@/hooks/useInfinitePagedQuery";

export function useFollowers(username: string) {
  const { items: users, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.userFollowers(username),
      queryFn: ({ pageParam }) => fetchFollowers(username, pageParam),
      enabled: Boolean(username),
      staleTime: PAGED_LIST_STALE_TIME,
      meta: { persist: false },
    },
    flattenItems,
  );

  return { users, ...rest };
}

export function useFollowing(username: string) {
  const { items: users, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.userFollowing(username),
      queryFn: ({ pageParam }) => fetchFollowing(username, pageParam),
      enabled: Boolean(username),
      staleTime: PAGED_LIST_STALE_TIME,
      meta: { persist: false },
    },
    flattenItems,
  );

  return { users, ...rest };
}
