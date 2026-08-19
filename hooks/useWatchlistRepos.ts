/**
 * Fetches the full GitHubRepo object for every repo in the watchlist.
 *
 * Why not filter from useRepos()?
 * useRepos() only fetches /user/repos, which returns repos the authenticated
 * user owns or is affiliated with. If a watchlisted repo belongs to a
 * different user, it will never appear in that list.
 *
 * Instead we fetch each watchlisted repo individually via GET /repos/{owner}/{repo},
 * which works for any public (or accessible private) repo regardless of ownership.
 * The queries share the same cache keys as the repo detail screen, so there's no
 * duplication - any previously-viewed repo is served instantly from cache.
 */

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
        // Don't fan out a request per watchlisted repo into a rate limit
        // we already know is exhausted; already-cached repos still render.
        enabled: Boolean(owner && name) && !isRateLimited(),
        staleTime: 1000 * 60 * 5,
      };
    }),
  });

  const repos = queries
    .map((q) => q.data)
    .filter((r): r is GitHubRepo => r !== undefined);

  const isLoading = queries.some((q) => q.isLoading);

  return { repos, isLoading };
}
