import type {
  GitHubContributorStats,
  GitHubPunchCardEntry,
} from "@/types/github.types";

export interface ContributorSummary {
  author: GitHubContributorStats["author"];
  commits: number;
  additions: number;
  deletions: number;
}

/**
 * Top contributors by commit count, with lifetime line totals. `hasLineCounts`
 * is false when every contributor reports zero additions and deletions, which
 * is what GitHub sends for repos with 10,000+ commits.
 */
export function summarizeContributors(
  stats: GitHubContributorStats[],
  limit: number,
): { top: ContributorSummary[]; hasLineCounts: boolean } {
  const all = stats.map((s) => ({
    author: s.author,
    commits: s.total,
    additions: s.weeks.reduce((sum, w) => sum + w.a, 0),
    deletions: s.weeks.reduce((sum, w) => sum + w.d, 0),
  }));
  return {
    top: [...all].sort((x, y) => y.commits - x.commits).slice(0, limit),
    hasLineCounts: all.some((c) => c.additions > 0 || c.deletions > 0),
  };
}

/** 0 = no commits, 1-4 = quarter of the busiest slot it falls into. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface PunchCardGrid {
  /** levels[day][hour], day 0 = Sunday. */
  levels: HeatLevel[][];
  busiest: { day: number; hour: number; commits: number } | null;
}

export function buildPunchCard(entries: GitHubPunchCardEntry[]): PunchCardGrid {
  const counts = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  let busiest: PunchCardGrid["busiest"] = null;

  for (const [day, hour, commits] of entries) {
    if (day < 0 || day > 6 || hour < 0 || hour > 23) continue;
    counts[day][hour] = commits;
    if (commits > 0 && (!busiest || commits > busiest.commits)) {
      busiest = { day, hour, commits };
    }
  }

  const max = busiest?.commits ?? 0;
  const levels = counts.map((row) =>
    row.map((c): HeatLevel => {
      if (c === 0 || max === 0) return 0;
      return Math.max(1, Math.ceil((c / max) * 4)) as HeatLevel;
    }),
  );

  return { levels, busiest };
}

/** 0-23 → "12 AM", "2 PM", ... */
export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}
