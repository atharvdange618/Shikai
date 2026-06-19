/**
 * Fetches the authenticated user's contribution calendar via GraphQL.
 * This data is not available via REST - GraphQL only.
 *
 * staleTime: 15 minutes. The graph only updates once per day anyway.
 */

import { fetchContributionGraph } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import type { ContributionStats } from "@/types/github-graphql.types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const contributionsQueryOptions = queryOptions({
  queryKey: queryKeys.contributions(),
  queryFn: fetchContributionGraph,
  staleTime: 1000 * 60 * 15,
});

export function useContributions() {
  const query = useQuery(contributionsQueryOptions);

  const stats = useMemo<ContributionStats | null>(() => {
    if (!query.data?.weeks.length) return null;

    const allDays = query.data.weeks.flatMap((w) => w.contributionDays);

    const todayStr = new Date().toISOString().slice(0, 10);
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
  }, [query.data?.weeks]);

  return {
    weeks: query.data?.weeks ?? [],
    totalContributions: query.data?.totalContributions ?? 0,
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
