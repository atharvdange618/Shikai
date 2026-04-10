import { githubAxios } from "@/lib/axios";
import type {
  CommitCountResponse,
  ContributionCalendar,
  ContributionGraphResponse,
  PinnedRepoNode,
  PinnedReposResponse,
  RecentActivityResponse,
  RecentRepoNode,
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

export async function fetchPinnedRepos(): Promise<PinnedRepoNode[]> {
  try {
    const response =
      await graphql<PinnedReposResponse["data"]>(PINNED_REPOS_QUERY);

    return response.viewer.pinnedItems.nodes;
  } catch (error) {
    if (__DEV__) {
      console.error("[Pinned Repos Error]", error);
    }
    throw error;
  }
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
              weekday
            }
          }
        }
      }
    }
  }
`;

export async function fetchContributionGraph(): Promise<ContributionCalendar> {
  try {
    const response = await graphql<ContributionGraphResponse["data"]>(
      CONTRIBUTION_GRAPH_QUERY,
    );

    return response.viewer.contributionsCollection.contributionCalendar;
  } catch (error) {
    if (__DEV__) {
      console.error("[Contribution Graph Error]", error);
    }
    throw error;
  }
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
  try {
    const response = await graphql<RecentActivityResponse["data"]>(
      RECENT_ACTIVITY_QUERY,
    );

    return response.viewer.repositories.nodes.filter(
      (repo) =>
        repo.defaultBranchRef &&
        repo.defaultBranchRef.target.history.edges.length > 0,
    );
  } catch (error) {
    if (__DEV__) {
      console.error("[Recent Activity Error]", error);
    }
    throw error;
  }
}
