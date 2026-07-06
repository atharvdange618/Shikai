/**
 * Fetches the authenticated user's contribution calendar via GraphQL.
 * This data is not available via REST - GraphQL only.
 *
 * staleTime: 15 minutes. The graph only updates once per day anyway.
 */

import { fetchContributionGraph } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { fetchContributionsForWidget } from "@/lib/widget-data";
import type { ContributionStats } from "@/types/github-graphql.types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { ContributionWidget } from "@/widgets/ContributionWidget";

export const contributionsQueryOptions = queryOptions({
  queryKey: queryKeys.contributions(),
  queryFn: fetchContributionGraph,
  staleTime: 1000 * 60 * 15,
});

export function useContributions() {
  const query = useQuery(contributionsQueryOptions);

  useEffect(() => {
    if (query.data?.weeks.length) {
      requestWidgetUpdate({
        widgetName: "ContributionGraph",
        renderWidget: async () => {
          const data = await fetchContributionsForWidget();
          if (data) {
            return (
              <ContributionWidget
                totalContributions={data.totalContributions}
                weeks={data.weeks}
                currentStreak={data.currentStreak}
                longestStreak={data.longestStreak}
              />
            );
          }
          return (
            <ContributionWidget
              totalContributions={0}
              weeks={[]}
              currentStreak={0}
              longestStreak={0}
            />
          );
        },
      });
    }
  }, [query.data?.weeks.length]);

  const stats = useMemo<ContributionStats | null>(() => {
    if (!query.data?.weeks.length) return null;

    const allDays = query.data.weeks.flatMap((w) => w.contributionDays);

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
