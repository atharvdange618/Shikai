import { useMemo } from "react";

import { useFilterableRepoList } from "@/hooks/useFilterableRepoList";
import { fetchStarred } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubRepo, RepoListParams } from "@/types/github.types";

export interface StarredFilters {
  sort?: NonNullable<RepoListParams["sort"]>;
  language?: string;
  search?: string;
}

export function useStarred(filters: StarredFilters = {}) {
  const { sort = "created", language, search } = filters;

  const languageFilter = useMemo(() => {
    if (!language) return undefined;
    return (repo: GitHubRepo) =>
      repo.language?.toLowerCase() === language.toLowerCase();
  }, [language]);

  return useFilterableRepoList({
    listQueryKey: [...queryKeys.starred(), { sort }] as const,
    fetchList: (page, per_page) => fetchStarred(page, per_page, sort),
    searchQualifier: "is:starred",
    search,
    filter: languageFilter,
  });
}

export function useStarredLanguageOptions(): string[] {
  const { repos } = useStarred();

  const languages = repos
    .map((r) => r.language)
    .filter((lang): lang is string => lang !== null);

  return Array.from(new Set(languages)).sort();
}
