import { useQueries } from "@tanstack/react-query";

import { isRateLimited } from "@/lib/axios";
import { fetchRepo } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { decodeRepoId } from "@/lib/utils";
import { useWatchlistStore } from "@/stores/watchlist.store";
import type { GitHubRepo } from "@/types/github.types";

export function useWatchlistRepos(): {
  repos: GitHubRepo[];
  isLoading: boolean;
} {
  const watchlistIds = useWatchlistStore((state) => state.watchlistIds);

  const queries = useQueries({
    queries: watchlistIds.map((repoId) => {
      const [owner, name] = decodeRepoId(repoId);
      return {
        queryKey: queryKeys.repo(owner, name),
        queryFn: () => fetchRepo(owner, name),
        enabled: Boolean(owner && name) && !isRateLimited(),
        staleTime: 1000 * 60 * 5,
      };
    }),
  });

  const repos = queries.map((q) => q.data).filter((r): r is GitHubRepo => r !== undefined);

  const isLoading = queries.some((q) => q.isLoading);

  return { repos, isLoading };
}
