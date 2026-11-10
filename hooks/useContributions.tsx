/**
 * Fetches the authenticated user's contribution calendar via GraphQL.
 * This data is not available via REST - GraphQL only.
 *
 * staleTime: 15 minutes. The graph only updates once per day anyway.
 */

import { getContributionStats } from "@/lib/contribution-stats";
import { fetchContributionGraph } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { fetchContributionsForWidget } from "@/lib/widget-data";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { ContributionWidget } from "@/widgets/ContributionWidget";

export const contributionsQueryOptions = queryOptions({
  queryKey: queryKeys.contributions(),
  queryFn: fetchContributionGraph,
  staleTime: 1000 * 60 * 15,
});

function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function useContributions() {
  const query = useQuery(contributionsQueryOptions);
  const weeks = query.data?.weeks;
  const [today, setToday] = useState(() => localDay(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // The day can change while the app is backgrounded or the time zone changes.
    function scheduleNextDay(now: Date) {
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timer = setTimeout(syncDay, midnight.getTime() - now.getTime());
    }
    function syncDay() {
      clearTimeout(timer);
      const now = new Date();
      setToday(localDay(now));
      scheduleNextDay(now);
    }
    scheduleNextDay(new Date());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncDay();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

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
      }).catch(() => console.error("Could not update the contribution widget"));
    }
  }, [query.data?.weeks.length]);

  const stats = useMemo(() => getContributionStats(weeks, today), [weeks, today]);

  return {
    weeks: weeks ?? [],
    totalContributions: query.data?.totalContributions ?? 0,
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}
