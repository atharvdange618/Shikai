export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  email: string | null;
  hireable: boolean | null;
  html_url: string;

  public_repos: number;
  followers: number;
  following: number;
  public_gists: number;

  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  html_url: string;
  clone_url: string;
  homepage: string | null;

  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;

  language: string | null;
  topics: string[];
  license: GitHubLicense | null;

  default_branch: string;
  size: number;

  created_at: string;
  updated_at: string;
  pushed_at: string;

  owner: GitHubUserSummary;
}

export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
}

export interface GitHubUserSummary {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export type GitHubLanguages = Record<string, number>;

export interface LanguageShare {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: GitHubUserSummary | null;
  committer: GitHubUserSummary | null;
}

export interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubTree {
  sha: string;
  url: string;
  truncated: boolean;
  tree: GitHubTreeItem[];
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit"; // blob=file, tree=folder, commit=submodule
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir" | "symlink" | "submodule";
  content?: string;
  encoding?: string;
  html_url: string;
  download_url: string | null;
}

export interface GitHubReadme {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
  html_url: string;
  download_url: string;
}

export type GitHubEventType =
  | "PushEvent"
  | "WatchEvent"
  | "ForkEvent"
  | "CreateEvent"
  | "DeleteEvent"
  | "PullRequestEvent"
  | "IssuesEvent"
  | "IssueCommentEvent"
  | "ReleaseEvent"
  | "PublicEvent"
  | "MemberEvent";

export interface GitHubEvent {
  id: string;
  type: GitHubEventType;
  actor: GitHubUserSummary;
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: Record<string, unknown>;
  public: boolean;
  created_at: string;
}

export interface GitHubPagination {
  next?: number;
  prev?: number;
  first?: number;
  last?: number;
}

export interface RepoListParams {
  page: number;
  per_page: number;
  sort?: "updated" | "pushed" | "full_name" | "created";
  type?: "all" | "public" | "private" | "forks" | "sources" | "member";
  language?: string;
}

export interface GitHubSocialAccount {
  provider: string;
  url: string;
}

export type SocialAccountProvider = "linkedin" | "twitter" | "generic";
