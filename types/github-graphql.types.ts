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
  color: string;
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
