import { fetchPullRequests } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";

const PER_PAGE = 15;

export function usePullRequests(
  owner: string,
  repo: string,
  state: "open" | "closed" = "open",
) {
  const { items: pullRequests, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.repoPullRequests(owner, repo, state),
      queryFn: ({ pageParam }) =>
        fetchPullRequests(owner, repo, pageParam, PER_PAGE, state),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 2,
    },
    (data) => data?.pages.flatMap((p) => p.pullRequests) ?? [],
  );

  return { pullRequests, ...rest };
}
