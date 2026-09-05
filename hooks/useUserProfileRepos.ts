import { useQuery } from "@tanstack/react-query";

import { fetchUserRepos } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";

export function useUserProfileRepos(username: string) {
  return useQuery({
    queryKey: queryKeys.userProfileRepos(username),
    queryFn: () => fetchUserRepos(username),
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 5,
  });
}

const PER_PAGE = 30;

export function useUserAllRepos(username: string) {
  const { items: repos, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.userAllRepos(username),
      queryFn: ({ pageParam }) =>
        fetchUserRepos(username, pageParam, PER_PAGE, "pushed"),
      enabled: Boolean(username),
      staleTime: 1000 * 60 * 5,
    },
    (data) => data?.pages.flatMap((p) => p.repos) ?? [],
  );

  return { repos, ...rest };
}
