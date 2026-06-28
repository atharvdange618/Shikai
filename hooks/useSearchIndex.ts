import MiniSearch from "minisearch";
import { useMemo } from "react";
import type { GitHubRepo } from "@/types/github.types";

function createIndex() {
  return new MiniSearch<GitHubRepo>({
    fields: ["name", "description", "language", "owner.login"],
    storeFields: ["id"],
    extractField: (doc, fieldName) => {
      if (fieldName === "owner.login") return doc.owner?.login ?? "";
      return (doc as unknown as Record<string, unknown>)[fieldName] ?? "";
    },
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
      combineWith: "AND",
    },
  });
}

export function useSearchIndex(
  repos: GitHubRepo[],
  search: string,
  extraFilter?: (repo: GitHubRepo) => boolean,
): GitHubRepo[] {
  const index = useMemo(() => {
    if (repos.length === 0) return null;

    const idx = createIndex();
    idx.addAll(repos);
    return idx;
  }, [repos]);

  return useMemo(() => {
    const trimmed = search?.trim();

    if (!trimmed) {
      return extraFilter ? repos.filter(extraFilter) : repos;
    }

    if (!index) return [];

    const results = index.search(trimmed);
    const matchedIds = new Set(results.map((r) => r.id));

    let filtered = repos.filter((repo) => matchedIds.has(repo.id));
    if (extraFilter) filtered = filtered.filter(extraFilter);
    return filtered;
  }, [index, repos, search, extraFilter]);
}
