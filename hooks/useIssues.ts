import { fetchIssues } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";

const PER_PAGE = 15;

export function useIssues(
  owner: string,
  repo: string,
  state: "open" | "closed" = "open",
) {
  const { items: issues, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.repoIssues(owner, repo, state),
      queryFn: ({ pageParam }) =>
        fetchIssues(owner, repo, pageParam, PER_PAGE, state),
      enabled: Boolean(owner && repo),
      staleTime: 1000 * 60 * 2,
    },
    (data) => data?.pages.flatMap((p) => p.issues) ?? [],
  );

  return { issues, ...rest };
}
