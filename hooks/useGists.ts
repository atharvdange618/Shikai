import { useQuery } from "@tanstack/react-query";

import { fetchGist, fetchGists } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";

const PER_PAGE = 30;

export function useGists(username: string, isSelf: boolean) {
  const { items: gists, ...rest } = useInfinitePagedQuery(
    {
      queryKey: queryKeys.gists(username),
      queryFn: ({ pageParam }) =>
        fetchGists(username, isSelf, pageParam, PER_PAGE),
      enabled: Boolean(username),
      staleTime: 1000 * 60 * 5,
    },
    (data) => data?.pages.flatMap((p) => p.gists) ?? [],
  );

  return { gists, ...rest };
}

export function useGist(id: string) {
  return useQuery({
    queryKey: queryKeys.gist(id),
    queryFn: () => fetchGist(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}
