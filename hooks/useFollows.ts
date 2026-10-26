import { fetchFollowers, fetchFollowing } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";

export function useFollowers(username: string) {
  const { items: users, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.userFollowers(username),
      queryFn: ({ pageParam }) => fetchFollowers(username, pageParam),
      enabled: Boolean(username),
      staleTime: 1000 * 60 * 5,
    },
    (data) => data?.pages.flatMap((p) => p.items) ?? [],
  );

  return { users, ...rest };
}

export function useFollowing(username: string) {
  const { items: users, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.userFollowing(username),
      queryFn: ({ pageParam }) => fetchFollowing(username, pageParam),
      enabled: Boolean(username),
      staleTime: 1000 * 60 * 5,
    },
    (data) => data?.pages.flatMap((p) => p.items) ?? [],
  );

  return { users, ...rest };
}
