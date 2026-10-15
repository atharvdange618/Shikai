import { describe, expect, it } from "vitest";

import { buildPunchCard, formatHour, summarizeContributors } from "@/lib/insights";
import type { GitHubContributorStats } from "@/types/github.types";

function contributor(
  login: string | null,
  weeks: [a: number, d: number, c: number][],
): GitHubContributorStats {
  return {
    author: login
      ? { id: login.length, login, avatar_url: "", html_url: "" }
      : null,
    total: weeks.reduce((sum, [, , c]) => sum + c, 0),
    weeks: weeks.map(([a, d, c], i) => ({ w: i, a, d, c })),
  };
}

describe("summarizeContributors", () => {
  it("sorts by commits, caps the list, and sums lines across weeks", () => {
    const { top, hasLineCounts } = summarizeContributors(
      [
        contributor("few", [[10, 1, 1]]),
        contributor("many", [
          [100, 20, 5],
          [50, 5, 4],
        ]),
        contributor("mid", [[5, 5, 3]]),
      ],
      2,
    );
    expect(top.map((c) => c.author?.login)).toEqual(["many", "mid"]);
    expect(top[0]).toMatchObject({ commits: 9, additions: 150, deletions: 25 });
    expect(hasLineCounts).toBe(true);
  });

  it("flags missing line counts (10,000+ commit repos)", () => {
    const { hasLineCounts } = summarizeContributors(
      [contributor("a", [[0, 0, 7]])],
      10,
    );
    expect(hasLineCounts).toBe(false);
  });

  it("keeps contributors with no GitHub account", () => {
    const { top } = summarizeContributors([contributor(null, [[1, 1, 2]])], 10);
    expect(top[0].author).toBeNull();
  });

  it("does not mutate the input order", () => {
    const stats = [contributor("a", [[0, 0, 1]]), contributor("b", [[0, 0, 2]])];
    summarizeContributors(stats, 10);
    expect(stats[0].author?.login).toBe("a");
  });
});

describe("buildPunchCard", () => {
  it("builds a 7x24 grid of levels relative to the busiest slot", () => {
    const { levels, busiest } = buildPunchCard([
      [2, 14, 8],
      [2, 15, 4],
      [0, 9, 1],
      [6, 23, 0],
    ]);
    expect(levels).toHaveLength(7);
    expect(levels.every((row) => row.length === 24)).toBe(true);
    expect(levels[2][14]).toBe(4);
    expect(levels[2][15]).toBe(2);
    expect(levels[0][9]).toBe(1);
    expect(levels[6][23]).toBe(0);
    expect(busiest).toEqual({ day: 2, hour: 14, commits: 8 });
  });

  it("gives any nonzero slot at least level 1", () => {
    const { levels } = buildPunchCard([
      [1, 1, 1000],
      [1, 2, 1],
    ]);
    expect(levels[1][2]).toBe(1);
  });

  it("returns an all-zero grid and no busiest slot for an empty repo", () => {
    const { levels, busiest } = buildPunchCard([]);
    expect(levels.flat().every((l) => l === 0)).toBe(true);
    expect(busiest).toBeNull();
  });

  it("ignores out-of-range entries", () => {
    const { busiest } = buildPunchCard([[7, 0, 5], [0, 24, 5]]);
    expect(busiest).toBeNull();
  });
});

describe("formatHour", () => {
  it("formats midnight, noon, and afternoon hours", () => {
    expect(formatHour(0)).toBe("12 AM");
    expect(formatHour(9)).toBe("9 AM");
    expect(formatHour(12)).toBe("12 PM");
    expect(formatHour(23)).toBe("11 PM");
  });
});
