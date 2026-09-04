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

export interface BlameRange {
  startingLine: number;
  endingLine: number;
  age: number;
  commit: {
    oid: string;
    messageHeadline: string;
    committedDate: string;
    author: {
      name: string | null;
    } | null;
  };
}

export interface BlameResponse {
  data: {
    repository: {
      object: {
        blame: {
          ranges: BlameRange[];
        };
      } | null;
      blob: {
        text: string | null;
        isBinary: boolean;
      } | null;
    } | null;
  };
}

export interface DiscussionCategory {
  name: string;
  emoji: string;
}

export interface DiscussionAuthor {
  login: string;
  avatarUrl: string | null;
}

export interface DiscussionListNode {
  id: string;
  number: number;
  title: string;
  isAnswered: boolean;
  createdAt: string;
  author: DiscussionAuthor | null;
  category: DiscussionCategory;
  comments: {
    totalCount: number;
  };
}

export interface DiscussionsListResponse {
  data: {
    repository: {
      discussions: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: DiscussionListNode[];
      };
    } | null;
  };
}

export interface DiscussionReply {
  id: string;
  body: string;
  createdAt: string;
  author: DiscussionAuthor | null;
}

export interface DiscussionComment {
  id: string;
  body: string;
  createdAt: string;
  author: DiscussionAuthor | null;
  isAnswer: boolean;
  replies: {
    totalCount: number;
    nodes: DiscussionReply[];
  };
}

export interface DiscussionDetail {
  id: string;
  number: number;
  title: string;
  body: string;
  isAnswered: boolean;
  createdAt: string;
  author: DiscussionAuthor | null;
  category: DiscussionCategory;
  comments: {
    totalCount: number;
    nodes: DiscussionComment[];
  };
}

export interface DiscussionDetailResponse {
  data: {
    repository: {
      discussion: DiscussionDetail | null;
    } | null;
  };
}
