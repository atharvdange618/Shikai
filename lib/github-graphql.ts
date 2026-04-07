import { githubAxios } from "@/lib/axios";
import type {
  CommitCountResponse,
  ContributionCalendar,
  ContributionGraphResponse,
  PinnedRepoNode,
  PinnedReposResponse,
} from "@/types/github-graphql.types";

const GRAPHQL_ENDPOINT = "/graphql";

async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { data } = await githubAxios.post<
    T & { errors?: { message: string }[] }
  >(GRAPHQL_ENDPOINT, { query, variables });

  if (
    "errors" in data &&
    Array.isArray(data.errors) &&
    data.errors.length > 0
  ) {
    const messages = data.errors.map((e) => e.message).join(", ");
    throw new Error(`GraphQL error: ${messages}`);
  }

  return data;
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
              color
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
