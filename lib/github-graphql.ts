import { githubAxios } from "@/lib/axios";
import type {
  BlameRange,
  BlameResponse,
  CommitCountResponse,
  ContributionCalendar,
  ContributionGraphResponse,
  PinnedRepoNode,
  PinnedReposResponse,
  RecentActivityResponse,
  RecentRepoNode,
  RepoCountResponse,
  RepoIssuesPRStats,
  RepoIssuesPRStatsResponse,
} from "@/types/github-graphql.types";

const GRAPHQL_ENDPOINT = "/graphql";

async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { data } = await githubAxios.post<{
    data: T;
    errors?: { message: string }[];
  }>(GRAPHQL_ENDPOINT, { query, variables });

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const messages = data.errors.map((e) => e.message).join(", ");
    throw new Error(`GraphQL error: ${messages}`);
  }

  return data.data;
}

const PINNED_REPOS_QUERY = `
  query PinnedRepos {
    viewer {
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            name
            description
            url
            isPrivate
            stargazerCount
            forkCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
    }
  }
`;

const REPO_COUNT_QUERY = `
  query RepoCount {
    viewer {
      repositories(affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
        totalCount
      }
    }
  }
`;

export async function fetchRepoCount(): Promise<number> {
  const response = await graphql<RepoCountResponse["data"]>(REPO_COUNT_QUERY);
  return response.viewer?.repositories?.totalCount ?? 0;
}

export async function fetchPinnedRepos(): Promise<PinnedRepoNode[]> {
  const response =
    await graphql<PinnedReposResponse["data"]>(PINNED_REPOS_QUERY);

  return response.viewer.pinnedItems.nodes;
}

const CONTRIBUTION_GRAPH_QUERY = `
  query ContributionGraph {
    viewer {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
              weekday
            }
          }
        }
      }
    }
  }
`;

export async function fetchContributionGraph(): Promise<ContributionCalendar> {
  const response = await graphql<ContributionGraphResponse["data"]>(
    CONTRIBUTION_GRAPH_QUERY,
  );

  return response.viewer.contributionsCollection.contributionCalendar;
}

const COMMIT_COUNT_QUERY = `
  query CommitCount($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history {
              totalCount
            }
          }
        }
      }
    }
  }
`;

export async function fetchCommitCount(
  owner: string,
  repo: string,
): Promise<number | null> {
  const response = await graphql<CommitCountResponse["data"]>(
    COMMIT_COUNT_QUERY,
    {
      owner,
      name: repo,
    },
  );

  return (
    response.repository?.defaultBranchRef?.target?.history?.totalCount ?? null
  );
}

const RECENT_ACTIVITY_QUERY = `
  query RecentActivity {
    viewer {
      login
      repositories(first: 20, orderBy: {field: PUSHED_AT, direction: DESC}) {
        nodes {
          id
          name
          url
          description
          isPrivate
          defaultBranchRef {
            name
            target {
              ... on Commit {
                history(first: 1) {
                  totalCount
                  edges {
                    node {
                      committedDate
                      messageHeadline
                      url
                      author {
                        name
                        user {
                          login
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchRecentActivity(): Promise<RecentRepoNode[]> {
  const response = await graphql<RecentActivityResponse["data"]>(
    RECENT_ACTIVITY_QUERY,
  );

  return response.viewer.repositories.nodes.filter(
    (repo) =>
      repo.defaultBranchRef &&
      repo.defaultBranchRef.target.history.edges.length > 0,
  );
}

const REPO_ISSUES_PR_STATS_QUERY = `
  query RepoIssuesPRStats($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      openPullRequests: pullRequests(states: OPEN) {
        totalCount
      }
      mergedPullRequests: pullRequests(states: MERGED) {
        totalCount
      }
    }
  }
`;

export async function fetchRepoIssuesPRStats(
  owner: string,
  repo: string,
): Promise<RepoIssuesPRStats> {
  const response = await graphql<RepoIssuesPRStatsResponse["data"]>(
    REPO_ISSUES_PR_STATS_QUERY,
    { owner, name: repo },
  );

  const r = response.repository;
  return {
    openIssues: r?.openIssues.totalCount ?? 0,
    closedIssues: r?.closedIssues.totalCount ?? 0,
    openPullRequests: r?.openPullRequests.totalCount ?? 0,
    mergedPullRequests: r?.mergedPullRequests.totalCount ?? 0,
  };
}

// blame lives on Commit, not Blob, despite how it reads ("blame this file") —
// resolve `ref` to its tip commit, then blame `path` from there. The blob
// text comes along in the same request via an aliased `object(expression)`.
const BLAME_QUERY = `
  query Blame($owner: String!, $name: String!, $ref: String!, $expression: String!, $path: String!) {
    repository(owner: $owner, name: $name) {
      object(expression: $ref) {
        ... on Commit {
          blame(path: $path) {
            ranges {
              startingLine
              endingLine
              age
              commit {
                oid
                messageHeadline
                committedDate
                author {
                  name
                }
              }
            }
          }
        }
      }
      blob: object(expression: $expression) {
        ... on Blob {
          text
          isBinary
        }
      }
    }
  }
`;

export interface BlameData {
  ranges: BlameRange[];
  text: string | null;
  isBinary: boolean;
}

export async function fetchBlame(
  owner: string,
  repo: string,
  ref: string,
  path: string,
): Promise<BlameData> {
  const response = await graphql<BlameResponse["data"]>(BLAME_QUERY, {
    owner,
    name: repo,
    ref,
    expression: `${ref}:${path}`,
    path,
  });

  return {
    ranges: response.repository?.object?.blame?.ranges ?? [],
    text: response.repository?.blob?.text ?? null,
    isBinary: response.repository?.blob?.isBinary ?? false,
  };
}
