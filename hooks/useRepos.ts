import { useMemo } from "react";

import { useFilterableRepoList } from "@/hooks/useFilterableRepoList";
import { fetchRepos } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubRepo, RepoListParams } from "@/types/github.types";

export interface RepoFilters {
  sort?: RepoListParams["sort"];
  type?: RepoListParams["type"];
  language?: string;
  search?: string;
}

export function useRepos(filters: RepoFilters = {}) {
  const { sort = "pushed", type, language, search } = filters;
  const apiType = type === "forks" ? "all" : type;

  const languageFilter = useMemo(() => {
    if (!language) return undefined;
    return (repo: GitHubRepo) =>
      repo.language?.toLowerCase() === language.toLowerCase();
  }, [language]);

  const typeFilter = useMemo(() => {
    if (type === "forks") return (repo: GitHubRepo) => repo.fork === true;
    return undefined;
  }, [type]);

  const combinedFilter = useMemo(() => {
    if (!languageFilter && !typeFilter) return undefined;
    return (repo: GitHubRepo) =>
      (!languageFilter || languageFilter(repo)) &&
      (!typeFilter || typeFilter(repo));
  }, [languageFilter, typeFilter]);

  return useFilterableRepoList({
    listQueryKey: [...queryKeys.repos(), { sort, type: apiType }] as const,
    fetchList: (page, per_page) =>
      fetchRepos({ page, per_page, sort, type: apiType }),
    search,
    filter: combinedFilter,
  });
}

export function useRepoLanguageOptions(): string[] {
  const { repos } = useRepos();

  const languages = repos
    .map((r) => r.language)
    .filter((lang): lang is string => lang !== null);

  return Array.from(new Set(languages)).sort();
}
