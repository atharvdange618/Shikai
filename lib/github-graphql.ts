import { githubAxios } from "@/lib/axios";
import type {
  BlameRange,
  BlameResponse,
  CommitCountResponse,
  ContributionCalendar,
  ContributionGraphResponse,
  DiscussionDetail,
  DiscussionDetailResponse,
  DiscussionListNode,
  DiscussionsListResponse,
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

  // A partial response (e.g. a repo with Discussions disabled) still carries
  // usable `data` alongside `errors`. Only throw when there's nothing to use;
  // callers already null-check the fields they read.
  if (
    Array.isArray(data.errors) &&
    data.errors.length > 0 &&
    data.data == null
  ) {
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

const DISCUSSIONS_QUERY = `
  query Discussions($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      discussions(first: 15, after: $after, orderBy: {field: UPDATED_AT, direction: DESC}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          isAnswered
          createdAt
          author {
            login
            avatarUrl
          }
          category {
            name
            emoji
          }
          comments {
            totalCount
          }
        }
      }
    }
  }
`;

export interface DiscussionsPage {
  discussions: DiscussionListNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

export async function fetchDiscussions(
  owner: string,
  repo: string,
  after?: string | null,
): Promise<DiscussionsPage> {
  const response = await graphql<DiscussionsListResponse["data"]>(
    DISCUSSIONS_QUERY,
    { owner, name: repo, after: after ?? null },
  );

  const discussions = response.repository?.discussions;
  return {
    discussions: discussions?.nodes ?? [],
    pageInfo: discussions?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}

const DISCUSSION_QUERY = `
  query Discussion($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      discussion(number: $number) {
        id
        number
        title
        body
        isAnswered
        createdAt
        author {
          login
          avatarUrl
        }
        category {
          name
          emoji
        }
        comments(first: 30) {
          totalCount
          nodes {
            id
            body
            createdAt
            isAnswer
            author {
              login
              avatarUrl
            }
            replies(first: 10) {
              totalCount
              nodes {
                id
                body
                createdAt
                author {
                  login
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchDiscussion(
  owner: string,
  repo: string,
  number: number,
): Promise<DiscussionDetail | null> {
  const response = await graphql<DiscussionDetailResponse["data"]>(
    DISCUSSION_QUERY,
    { owner, name: repo, number },
  );

  return response.repository?.discussion ?? null;
}
