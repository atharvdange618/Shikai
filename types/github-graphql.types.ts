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
  contributionLevel?:
    | "NONE"
    | "FIRST_QUARTILE"
    | "SECOND_QUARTILE"
    | "THIRD_QUARTILE"
    | "FOURTH_QUARTILE";
  weekday: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionStats {
  currentStreak: number;
  longestStreak: number;
  mostActiveDay: string;
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

export interface RepoIssuesPRStats {
  openIssues: number;
  closedIssues: number;
  openPullRequests: number;
  mergedPullRequests: number;
}

export interface RepoIssuesPRStatsResponse {
  data: {
    repository: {
      openIssues: { totalCount: number };
      closedIssues: { totalCount: number };
      openPullRequests: { totalCount: number };
      mergedPullRequests: { totalCount: number };
    } | null;
  };
}

export interface RepoCountResponse {
  data: {
    viewer: {
      repositories: {
        totalCount: number;
      } | null;
    } | null;
  };
}
