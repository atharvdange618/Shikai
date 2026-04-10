export interface PinnedRepoNode {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  isPrivate: boolean;
  primaryLanguage: {
    name: string;
    color: string | null;
  } | null;
}

export interface PinnedReposResponse {
  data: {
    viewer: {
      pinnedItems: {
        nodes: PinnedRepoNode[];
      };
    };
  };
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
  weekday: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionGraphResponse {
  data: {
    viewer: {
      contributionsCollection: {
        contributionCalendar: ContributionCalendar;
      };
    };
  };
}

export interface CommitCountResponse {
  data: {
    repository: {
      defaultBranchRef: {
        target: {
          history: {
            totalCount: number;
          };
        };
      } | null;
    } | null;
  };
}

export interface RecentCommitNode {
  committedDate: string;
  messageHeadline: string;
  url: string;
  author: {
    name: string | null;
    user: {
      login: string;
    } | null;
  };
}

export interface RecentRepoNode {
  id: string;
  name: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  defaultBranchRef: {
    name: string;
    target: {
      history: {
        totalCount: number;
        edges: {
          node: RecentCommitNode;
        }[];
      };
    };
  } | null;
}

export interface RecentActivityResponse {
  data: {
    viewer: {
      login: string;
      repositories: {
        nodes: RecentRepoNode[];
      };
    };
  };
}
