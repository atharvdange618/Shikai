import type { ContributionStats, ContributionWeek } from "@/types/github-graphql.types";

export function getContributionStats(
  weeks: ContributionWeek[] | undefined,
  today: string,
): ContributionStats | null {
  if (!weeks?.length) return null;

  const allDays = weeks.flatMap((w) => w.contributionDays);

  let i = allDays.length - 1;
  while (i >= 0 && allDays[i].date > today) {
    i--;
  }

  if (i >= 0 && allDays[i].date === today && allDays[i].contributionCount === 0) {
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

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const day of allDays) {
    weekdayTotals[day.weekday] += day.contributionCount;
  }
  const maxIdx = weekdayTotals.indexOf(Math.max(...weekdayTotals));

  return {
    currentStreak,
    longestStreak,
    mostActiveDay: weekdayNames[maxIdx],
  };
}
