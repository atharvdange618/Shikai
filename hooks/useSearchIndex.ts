import type { GitHubRepo } from "@/types/github.types";
import { useMemo } from "react";

function matchesQuery(repo: GitHubRepo, query: string): boolean {
  const q = query.toLowerCase();
  const name = repo.name?.toLowerCase() ?? "";
  const desc = repo.description?.toLowerCase() ?? "";
  const lang = repo.language?.toLowerCase() ?? "";
  const owner = repo.owner?.login?.toLowerCase() ?? "";
  return (
    name.includes(q) ||
    desc.includes(q) ||
    lang.includes(q) ||
    owner.includes(q)
  );
}

export function useSearchIndex(
  repos: GitHubRepo[],
  search: string,
  extraFilter?: (repo: GitHubRepo) => boolean,
): GitHubRepo[] {
  return useMemo(() => {
    const trimmed = search?.trim();

    let filtered = repos;
    if (trimmed) {
      filtered = repos.filter((repo) => matchesQuery(repo, trimmed));
    }
    if (extraFilter) {
      filtered = filtered.filter(extraFilter);
    }
    return filtered;
  }, [repos, search, extraFilter]);
}
