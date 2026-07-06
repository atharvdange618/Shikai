import { getStoredToken } from "./secure-storage";

const GITHUB_API_BASE = "https://api.github.com";

const CONTRIBUTION_QUERY = `
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

export interface WidgetContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel:
    | "NONE"
    | "FIRST_QUARTILE"
    | "SECOND_QUARTILE"
    | "THIRD_QUARTILE"
    | "FOURTH_QUARTILE";
  weekday: number;
}

export interface WidgetContributionWeek {
  contributionDays: WidgetContributionDay[];
}

export interface WidgetContributionData {
  totalContributions: number;
  weeks: WidgetContributionWeek[];
  currentStreak: number;
  longestStreak: number;
}

export async function fetchContributionsForWidget(): Promise<WidgetContributionData | null> {
  const token = await getStoredToken();
  if (!token) return null;

  const response = await fetch(`${GITHUB_API_BASE}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query: CONTRIBUTION_QUERY }),
  });

  if (!response.ok) return null;

  const json = await response.json();

  if (Array.isArray(json.errors) && json.errors.length > 0) {
    return null;
  }

  const calendar =
    json.data.viewer.contributionsCollection.contributionCalendar;

  const allDays = calendar.weeks.flatMap(
    (w: WidgetContributionWeek) => w.contributionDays,
  );

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let i = allDays.length - 1;
  while (i >= 0 && allDays[i].date > todayStr) {
    i--;
  }

  if (
    i >= 0 &&
    allDays[i].date === todayStr &&
    allDays[i].contributionCount === 0
  ) {
    i--;
  }

  let currentStreak = 0;
  for (; i >= 0; i--) {
    if (allDays[i].contributionCount > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let streak = 0;
  for (const day of allDays) {
    if (day.contributionCount > 0) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
    currentStreak,
    longestStreak,
  };
}
