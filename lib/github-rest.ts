import { githubAxios } from "@/lib/axios";
import type {
  GitHubCommit,
  GitHubContent,
  GitHubContributor,
  GitHubEvent,
  GitHubLanguages,
  GitHubPagination,
  GitHubReadme,
  GitHubRepo,
  GitHubTree,
  GitHubUser,
  RepoListParams,
} from "@/types/github.types";

function parseLinkHeader(linkHeader: string | undefined): GitHubPagination {
  if (!linkHeader) return {};

  const pagination: GitHubPagination = {};
  const parts = linkHeader.split(",");

  for (const part of parts) {
    const match = part.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="(\w+)"/);
    if (match) {
      const page = parseInt(match[1], 10);
      const rel = match[2] as keyof GitHubPagination;
      pagination[rel] = page;
    }
  }

  return pagination;
}

export function decodeBase64(encoded: string): string {
  const cleaned = encoded.replace(/\n/g, "");
  return atob(cleaned);
}

export async function fetchAuthenticatedUser(): Promise<GitHubUser> {
  const { data } = await githubAxios.get<GitHubUser>("/user");
  return data;
}

export async function validateToken(token: string): Promise<GitHubUser> {
  const { data } = await githubAxios.get<GitHubUser>("/user", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export interface FetchReposResult {
  repos: GitHubRepo[];
  pagination: GitHubPagination;
}

export async function fetchRepos(
  params: RepoListParams,
): Promise<FetchReposResult> {
  const { page, per_page, sort = "updated", type = "all" } = params;

  const { data, headers } = await githubAxios.get<GitHubRepo[]>("/user/repos", {
    params: {
      page,
      per_page,
      sort,
      type,
      affiliation: "owner,collaborator,organization_member",
    },
  });

  return {
    repos: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function fetchRepo(
  owner: string,
  repo: string,
): Promise<GitHubRepo> {
  const { data } = await githubAxios.get<GitHubRepo>(`/repos/${owner}/${repo}`);
  return data;
}

export async function fetchLanguages(
  owner: string,
  repo: string,
): Promise<GitHubLanguages> {
  const { data } = await githubAxios.get<GitHubLanguages>(
    `/repos/${owner}/${repo}/languages`,
  );
  return data;
}

export interface FetchCommitsResult {
  commits: GitHubCommit[];
  pagination: GitHubPagination;
}

export async function fetchCommits(
  owner: string,
  repo: string,
  page: number,
  per_page: number = 10,
): Promise<FetchCommitsResult> {
  const { data, headers } = await githubAxios.get<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits`,
    { params: { page, per_page } },
  );

  return {
    commits: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function fetchLastCommit(
  owner: string,
  repo: string,
): Promise<GitHubCommit | null> {
  const { data } = await githubAxios.get<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits`,
    { params: { per_page: 1 } },
  );
  return data[0] ?? null;
}

export async function fetchContributors(
  owner: string,
  repo: string,
): Promise<GitHubContributor[]> {
  const { data } = await githubAxios.get<GitHubContributor[]>(
    `/repos/${owner}/${repo}/contributors`,
    { params: { per_page: 20 } },
  );
  return data;
}

export async function fetchFileTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubTree> {
  const { data: branchData } = await githubAxios.get(
    `/repos/${owner}/${repo}/branches/${branch}`,
  );
  const treeSha = branchData.commit.commit.tree.sha;

  const { data } = await githubAxios.get<GitHubTree>(
    `/repos/${owner}/${repo}/git/trees/${treeSha}`,
    { params: { recursive: 1 } },
  );

  return data;
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
): Promise<{ content: string; meta: GitHubContent }> {
  const { data } = await githubAxios.get<GitHubContent>(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
  );

  if (data.type !== "file" || !data.content) {
    throw new Error(`"${path}" is not a file`);
  }

  return {
    content: decodeBase64(data.content),
    meta: data,
  };
}

export async function fetchReadme(
  owner: string,
  repo: string,
): Promise<string> {
  const { data } = await githubAxios.get<GitHubReadme>(
    `/repos/${owner}/${repo}/readme`,
  );
  return decodeBase64(data.content);
}

export interface FetchStarredResult {
  repos: GitHubRepo[];
  pagination: GitHubPagination;
}

export async function fetchStarred(
  page: number,
  per_page: number = 10,
  sort: "created" | "updated" = "created",
): Promise<FetchStarredResult> {
  const { data, headers } = await githubAxios.get<GitHubRepo[]>(
    "/user/starred",
    {
      params: { page, per_page, sort },
    },
  );

  return {
    repos: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function fetchUserEvents(
  username: string,
): Promise<GitHubEvent[]> {
  const { data } = await githubAxios.get<GitHubEvent[]>(
    `/users/${username}/events`,
    { params: { per_page: 20 } },
  );
  return data;
}
