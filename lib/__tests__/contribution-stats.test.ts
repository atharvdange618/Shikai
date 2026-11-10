import { describe, expect, it } from "vitest";

import { getContributionStats } from "@/lib/contribution-stats";
import type { ContributionWeek } from "@/types/github-graphql.types";

describe("getContributionStats", () => {
  const weeks: ContributionWeek[] = [
    {
      contributionDays: [
        { date: "2026-11-08", contributionCount: 1, weekday: 0 },
        { date: "2026-11-09", contributionCount: 3, weekday: 1 },
        { date: "2026-11-10", contributionCount: 0, weekday: 2 },
        { date: "2026-11-11", contributionCount: 0, weekday: 3 },
      ],
    },
  ];

  it("keeps yesterday's streak when today has no contributions yet", () => {
    expect(getContributionStats(weeks, "2026-11-10")).toEqual({
      currentStreak: 2,
      longestStreak: 2,
      mostActiveDay: "Mon",
    });
  });

  it("ends the current streak when a contribution-free day becomes yesterday", () => {
    expect(getContributionStats(weeks, "2026-11-11")).toMatchObject({
      currentStreak: 0,
      longestStreak: 2,
    });
  });
});
