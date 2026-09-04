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
  type?: string;

  public_repos: number;
  total_private_repos: number;
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
  ssh_url: string;
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

export interface GitHubCommitDetail extends GitHubCommit {
  stats: { additions: number; deletions: number; total: number };
  files: GitHubPullRequestFile[];
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

interface PushEventPayload {
  size: number;
  ref: string;
  head: string;
  before: string;
  commits: {
    sha: string;
    message: string;
    url: string;
    author: { name: string; email: string; username: string };
  }[];
}

interface ForkEventPayload {
  forkee: {
    full_name: string;
    html_url: string;
    name: string;
    owner: GitHubUserSummary;
  };
}

interface CreateEventPayload {
  ref_type: "repository" | "branch" | "tag";
  ref: string | null;
  master_branch: string;
}

interface PullRequestEventPayload {
  action: string;
  pull_request: {
    number: number;
    merged: boolean;
    html_url: string;
    title: string;
    user: GitHubUserSummary;
  };
}

interface IssuesEventPayload {
  action: string;
  issue: {
    number: number;
    html_url: string;
    title: string;
    user: GitHubUserSummary;
  };
}

interface ReleaseEventPayload {
  action: string;
  release: {
    tag_name: string;
    html_url: string;
    name: string | null;
  };
}

interface WatchEventPayload {
  action: "started";
}

type PublicEventPayload = Record<string, never>;

type KnownEventPayload =
  | { type: "PushEvent"; payload: PushEventPayload }
  | { type: "ForkEvent"; payload: ForkEventPayload }
  | { type: "CreateEvent"; payload: CreateEventPayload }
  | { type: "PullRequestEvent"; payload: PullRequestEventPayload }
  | { type: "IssuesEvent"; payload: IssuesEventPayload }
  | { type: "ReleaseEvent"; payload: ReleaseEventPayload }
  | { type: "WatchEvent"; payload: WatchEventPayload }
  | { type: "PublicEvent"; payload: PublicEventPayload };

type UnknownEventPayload = {
  type: Exclude<GitHubEventType, KnownEventPayload["type"]>;
  payload: Record<string, unknown>;
};

export type GitHubEvent = {
  id: string;
  actor: GitHubUserSummary;
  repo: { id: number; name: string; url: string };
  public: boolean;
  created_at: string;
} & (KnownEventPayload | UnknownEventPayload);

export interface GitHubPagination {
  next?: number;
  prev?: number;
  first?: number;
  last?: number;
}

export interface RepoListParams {
  page: number;
  per_page: number;
  sort?: "pushed" | "created" | "full_name";
  type?: "all" | "public" | "private" | "forks" | "sources" | "member";
  language?: string;
}

export interface GitHubSocialAccount {
  provider: string;
  url: string;
}

export type SocialAccountProvider = "linkedin" | "twitter" | "generic";

export interface GitHubBranch {
  name: string;
  commit: { sha: string };
  protected: boolean;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  repository_url: string;
  body: string | null;
  user: GitHubUserSummary;
  labels: GitHubLabel[];
  assignees: GitHubUserSummary[];
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: { merged_at: string | null };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  html_url: string;
  body: string | null;
  user: GitHubUserSummary;
  labels: GitHubLabel[];
  assignees: GitHubUserSummary[];
  comments: number;
  review_comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merged: boolean;
  head: { ref: string; label: string; sha: string };
  base: { ref: string; label: string; sha: string };
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: {
    name: string;
    browser_download_url: string;
    content_type: string;
    size: number;
  }[];
}

export interface GitHubComment {
  id: number;
  body: string;
  user: GitHubUserSummary;
  created_at: string;
  updated_at: string;
}

export interface GitHubReviewComment {
  id: number;
  body: string;
  user: GitHubUserSummary;
  created_at: string;
  updated_at: string;
  path: string;
  line: number | null;
  original_line: number | null;
  diff_hunk: string;
  in_reply_to_id?: number;
  pull_request_review_id: number | null;
}

export type GitHubReviewState =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "COMMENTED"
  | "DISMISSED"
  | "PENDING";

export interface GitHubReview {
  id: number;
  user: GitHubUserSummary;
  body: string | null;
  state: GitHubReviewState;
  submitted_at: string | null;
  commit_id: string;
}

export interface GitHubRequestedReviewers {
  users: GitHubUserSummary[];
  teams: { name: string; slug: string }[];
}

export type GitHubFileStatus =
  | "added"
  | "removed"
  | "modified"
  | "renamed"
  | "copied"
  | "changed"
  | "unchanged";

export interface GitHubPullRequestFile {
  sha: string;
  filename: string;
  previous_filename?: string;
  status: GitHubFileStatus;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export type GitHubCheckStatus = "queued" | "in_progress" | "completed";

export type GitHubCheckConclusion =
  | "success"
  | "failure"
  | "neutral"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | null;

export interface GitHubCheckRun {
  id: number;
  name: string;
  status: GitHubCheckStatus;
  conclusion: GitHubCheckConclusion;
  html_url: string;
  started_at: string;
  completed_at: string | null;
}

export type GitHubCombinedStatusState = "pending" | "success" | "failure" | "error";

export interface GitHubCombinedStatus {
  state: GitHubCombinedStatusState;
  total_count: number;
  statuses: {
    context: string;
    state: GitHubCombinedStatusState;
    description: string | null;
    target_url: string | null;
  }[];
}

export interface GitHubNotification {
  id: string;
  unread: boolean;
  reason: string;
  updated_at: string;
  last_read_at: string | null;
  subject: {
    title: string;
    url: string | null;
    latest_comment_url: string | null;
    type:
    | "Issue"
    | "PullRequest"
    | "Discussion"
    | "DiscussionComment"
    | "CheckRun"
    | "Commit"
    | "Release";
  };
  repository: {
    id: number;
    full_name: string;
    html_url: string;
    owner: GitHubUserSummary;
  };
  url: string;
  subscription_url: string;
}

export interface GitHubGistFile {
  filename: string;
  language: string | null;
  type: string;
  size: number;
  raw_url: string;
  truncated?: boolean;
  content?: string;
}

export interface GitHubGist {
  id: string;
  description: string | null;
  html_url: string;
  public: boolean;
  comments: number;
  created_at: string;
  updated_at: string;
  owner: GitHubUserSummary;
  files: Record<string, GitHubGistFile>;
}
