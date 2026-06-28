import { githubAxios } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import type {
  GitHubBranch,
  GitHubComment,
  GitHubCommit,
  GitHubContent,
  GitHubContributor,
  GitHubEvent,
  GitHubIssue,
  GitHubLanguages,
  GitHubPagination,
  GitHubPullRequest,
  GitHubReadme,
  GitHubRelease,
  GitHubRepo,
  GitHubSocialAccount,
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
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function fetchAuthenticatedUser(): Promise<GitHubUser> {
  const { data } = await githubAxios.get<GitHubUser>("/user");
  return data;
}

export async function fetchUserProfile(username: string): Promise<GitHubUser> {
  const { data } = await githubAxios.get<GitHubUser>(
    `/users/${encodeURIComponent(username)}`,
  );
  return data;
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    id: number;
    type: "User" | "Organization";
  };
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  target_id: number;
  target_type: "User" | "Organization";
  permissions: Record<string, string>;
  events: string[];
  created_at: string;
  updated_at: string;
  single_file_name: string | null;
  has_multiple_single_files: boolean;
  single_file_paths: string[];
  suspended_by: string | null;
  suspended_at: string | null;
}

export async function fetchUserInstallations(): Promise<GitHubInstallation[]> {
  const { data } = await githubAxios.get<{
    total_count: number;
    installations: GitHubInstallation[];
  }>("/user/installations");
  return data.installations;
}

export async function validateToken(token: string): Promise<GitHubUser> {
  const prevToken = useAuthStore.getState().token;
  useAuthStore.getState().setToken(token);
  try {
    const { data } = await githubAxios.get<GitHubUser>("/user");
    return data;
  } finally {
    if (prevToken) {
      useAuthStore.getState().setToken(prevToken);
    } else {
      useAuthStore.getState().clearAuth();
    }
  }
}

export async function fetchSocialAccounts(): Promise<GitHubSocialAccount[]> {
  const { data } = await githubAxios.get<GitHubSocialAccount[]>(
    "/user/social_accounts",
  );
  return data;
}

export interface FetchReposResult {
  repos: GitHubRepo[];
  pagination: GitHubPagination;
}

export async function fetchRepoCount(): Promise<number> {
  const { headers } = await githubAxios.get<GitHubRepo[]>("/user/repos", {
    params: {
      per_page: 1,
    },
  });

  const pagination = parseLinkHeader(headers["link"]);
  if (pagination.last) return pagination.last;
  return 1;
}

export async function fetchRepos(
  params: RepoListParams,
): Promise<FetchReposResult> {
  const { page, per_page, sort = "updated", type } = params;

  const { data, headers } = await githubAxios.get<GitHubRepo[]>("/user/repos", {
    params: {
      page,
      per_page,
      sort,
      ...(type
        ? { type }
        : { affiliation: "owner,collaborator,organization_member" }),
    },
  });

  return {
    repos: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function fetchUserRepos(
  username: string,
  page: number = 1,
  per_page: number = 6,
  sort: "created" | "updated" | "pushed" | "full_name" = "updated",
): Promise<{ repos: GitHubRepo[]; pagination: GitHubPagination }> {
  const { data, headers } = await githubAxios.get<GitHubRepo[]>(
    `/users/${encodeURIComponent(username)}/repos`,
    { params: { page, per_page, sort } },
  );
  return {
    repos: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function fetchRepo(
  owner: string,
  repo: string,
): Promise<GitHubRepo> {
  const { data } = await githubAxios.get<GitHubRepo>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  );
  return data;
}

export async function fetchBranches(
  owner: string,
  repo: string,
): Promise<GitHubBranch[]> {
  const { data } = await githubAxios.get<GitHubBranch[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
    { params: { per_page: 100 } },
  );
  return data;
}

export async function fetchLanguages(
  owner: string,
  repo: string,
): Promise<GitHubLanguages> {
  const { data } = await githubAxios.get<GitHubLanguages>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
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
  branch?: string,
): Promise<FetchCommitsResult> {
  const { data, headers } = await githubAxios.get<GitHubCommit[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
    { params: { page, per_page, sha: branch } },
  );

  return {
    commits: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export async function searchRepos(
  query: string,
  page: number = 1,
  per_page: number = 10,
  sort?: "stars" | "forks" | "help-wanted-issues" | "updated",
  order?: "desc" | "asc",
): Promise<{ repos: GitHubRepo[]; totalCount: number; pagination: GitHubPagination }> {
  const { data, headers } = await githubAxios.get<GitHubSearchResult<GitHubRepo>>(
    "/search/repositories",
    { params: { q: query, page, per_page, sort, order } },
  );
  return {
    repos: data.items,
    totalCount: data.total_count,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function searchUsers(
  query: string,
  page: number = 1,
  per_page: number = 10,
  sort?: "followers" | "repositories" | "joined",
  order?: "desc" | "asc",
): Promise<{ users: GitHubUser[]; totalCount: number; pagination: GitHubPagination }> {
  const { data, headers } = await githubAxios.get<GitHubSearchResult<GitHubUser>>(
    "/search/users",
    { params: { q: query, page, per_page, sort, order } },
  );
  return {
    users: data.items,
    totalCount: data.total_count,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function searchIssues(
  query: string,
  page: number = 1,
  per_page: number = 10,
  sort?: "comments" | "reactions" | "interactions" | "created" | "updated",
  order?: "desc" | "asc",
): Promise<{ issues: GitHubIssue[]; totalCount: number; pagination: GitHubPagination }> {
  const { data, headers } = await githubAxios.get<GitHubSearchResult<GitHubIssue>>(
    "/search/issues",
    { params: { q: query, page, per_page, sort, order } },
  );
  return {
    issues: data.items,
    totalCount: data.total_count,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function fetchLastCommit(
  owner: string,
  repo: string,
): Promise<GitHubCommit | null> {
  const { data } = await githubAxios.get<GitHubCommit[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
    { params: { per_page: 1 } },
  );
  return data[0] ?? null;
}

export async function fetchContributors(
  owner: string,
  repo: string,
): Promise<GitHubContributor[]> {
  const { data } = await githubAxios.get<GitHubContributor[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors`,
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
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,
  );
  const treeSha = branchData.commit.commit.tree.sha;

  const { data } = await githubAxios.get<GitHubTree>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(treeSha)}`,
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
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`,
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
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
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
  sort: NonNullable<RepoListParams["sort"]> = "created",
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

export interface FetchEventsResult {
  events: GitHubEvent[];
  pagination: GitHubPagination;
}

export async function fetchUserEvents(
  username: string,
  page: number,
  per_page: number = 20,
): Promise<FetchEventsResult> {
  const { data, headers } = await githubAxios.get<GitHubEvent[]>(
    `/users/${username}/events`,
    { params: { page, per_page } },
  );

  return {
    events: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export interface FetchIssuesResult {
  issues: GitHubIssue[];
  pagination: GitHubPagination;
}

export async function fetchIssues(
  owner: string,
  repo: string,
  page: number,
  per_page: number = 10,
  state: "open" | "closed" | "all" = "open",
): Promise<FetchIssuesResult> {
  const { data, headers } = await githubAxios.get<GitHubIssue[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
    { params: { page, per_page, state } },
  );

  const issues = data.filter((item) => !item.pull_request);

  return {
    issues,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export interface FetchPullRequestsResult {
  pullRequests: GitHubPullRequest[];
  pagination: GitHubPagination;
}

export async function fetchPullRequests(
  owner: string,
  repo: string,
  page: number,
  per_page: number = 10,
  state: "open" | "closed" | "all" = "open",
): Promise<FetchPullRequestsResult> {
  const { data, headers } = await githubAxios.get<GitHubPullRequest[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
    { params: { page, per_page, state } },
  );

  return {
    pullRequests: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

const SHIKAI_REPO_OWNER = "atharvdange618";
const SHIKAI_REPO_NAME = "Shikai";

export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const { data } = await githubAxios.get<GitHubRelease>(
      `/repos/${SHIKAI_REPO_OWNER}/${SHIKAI_REPO_NAME}/releases/latest`,
    );
    return data;
  } catch {
    return null;
  }
}

export async function fetchIssue(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<GitHubIssue> {
  const { data } = await githubAxios.get<GitHubIssue>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`,
  );
  return data;
}

export async function fetchIssueComments(
  owner: string,
  repo: string,
  issueNumber: number,
  page: number = 1,
  per_page: number = 30,
): Promise<{ comments: GitHubComment[]; pagination: GitHubPagination }> {
  const { data, headers } = await githubAxios.get<GitHubComment[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments`,
    { params: { page, per_page } },
  );
  return {
    comments: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}

export async function fetchPullRequestDetail(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const { data } = await githubAxios.get<GitHubPullRequest>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}`,
  );
  return data;
}

export async function fetchPullRequestComments(
  owner: string,
  repo: string,
  prNumber: number,
  page: number = 1,
  per_page: number = 30,
): Promise<{ comments: GitHubComment[]; pagination: GitHubPagination }> {
  const { data, headers } = await githubAxios.get<GitHubComment[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${prNumber}/comments`,
    { params: { page, per_page } },
  );
  return {
    comments: data,
    pagination: parseLinkHeader(headers["link"]),
  };
}
