import { describe, expect, it } from "vitest";
import {
  buildThreads,
  checkGroup,
  checksSummary,
  checksIcon,
  latestReviews,
} from "@/lib/pr-review";
import type { CheckSummaryItem } from "@/hooks/usePullRequestDetail";
import type { GitHubReviewComment, GitHubReview } from "@/types/github.types";

const user = { id: 1, login: "reader", avatar_url: "", html_url: "" };
function comment(id: number, path: string, replyTo?: number): GitHubReviewComment {
  return {
    id,
    path,
    body: "Comment",
    user,
    created_at: `2026-11-04T10:00:${String(id).padStart(2, "0")}Z`,
    updated_at: "",
    line: null,
    original_line: 42,
    diff_hunk: "@@ -1 +1 @@\n-old\n+new",
    pull_request_review_id: 1,
    ...(replyTo ? { in_reply_to_id: replyTo } : {}),
  };
}
const check = (conclusion: CheckSummaryItem["conclusion"]): CheckSummaryItem => ({
  key: String(conclusion),
  name: "CI",
  conclusion,
  url: null,
  status: conclusion === "pending" ? "in_progress" : "completed",
  startedAt: null,
  completedAt: null,
});

describe("PR review threads", () => {
  it("groups roots by file, keeps diff context, and orders replies across pages", () => {
    const threads = buildThreads([
      comment(2, "z.ts"),
      comment(3, "a.ts"),
      comment(6, "z.ts", 2),
      comment(4, "z.ts", 2),
      comment(5, "a.ts"),
    ]);
    expect(threads.map((thread) => thread.root.id)).toEqual([3, 5, 2]);
    expect(threads[2].replies.map((reply) => reply.id)).toEqual([4, 6]);
    expect(threads[2].line).toBe(42);
    expect(threads[2].diffHunk).toContain("+new");
  });
  it("does not count replies whose root is on a later page as threads", () => {
    expect(buildThreads([comment(4, "a.ts", 2)])).toEqual([]);
  });
});

describe("checks", () => {
  it("uses state-specific icons for empty, partial, failed, and completed checks", () => {
    expect(checksIcon([], false, false, false)).toBe("circle-slash");
    expect(checksIcon([check("success")], false, false, true)).toBe("clock");
    expect(checksIcon([check("success")], false, true, false)).toBe("alert");
    expect(checksIcon([check("timed_out")], false, false, false)).toBe("x-circle");
    expect(checksIcon([check("success")], false, false, false)).toBe("check-circle");
    expect(checksIcon([check("skipped")], false, false, false)).toBe("circle-slash");
  });
  it.each(["failure", "error", "timed_out", "action_required"] as const)(
    "puts %s in the attention group",
    (result) => {
      expect(checkGroup(result)).toBe("Needs attention");
      expect(checksSummary([check(result)], false, false, false)).toContain("need attention");
    },
  );
  it("keeps other conclusions separate", () => {
    expect(
      ["success", "skipped", "cancelled", "neutral", "pending", "stale", null].map((result) =>
        checkGroup(result as CheckSummaryItem["conclusion"]),
      ),
    ).toEqual(["Passed", "Skipped", "Cancelled", "Neutral", "Running", "Unknown", "Unknown"]);
  });
  it.each([
    [true, false, false],
    [false, true, false],
    [false, false, true],
  ])("never declares success while loading, unavailable, or partial", (loading, error, partial) => {
    expect(checksSummary([check("success")], loading, error, partial)).not.toContain(
      "All checks passed",
    );
  });
  it("distinguishes empty, running, all-passed, and mixed completed results", () => {
    expect(checksSummary([], false, false, false)).toBe("No checks reported");
    expect(checksSummary([check("pending")], false, false, false)).toBe("1 running");
    expect(checksSummary([check("success")], false, false, false)).toBe("All checks passed");
    expect(checksSummary([check("success"), check("skipped")], false, false, false)).toContain(
      "1 passed · 2 total",
    );
  });
});

it("uses the latest review for each reviewer even across pages", () => {
  const review = (
    id: number,
    state: GitHubReview["state"],
    submitted_at: string,
  ): GitHubReview => ({
    id,
    state,
    submitted_at,
    user,
    body: null,
    commit_id: "abc",
  });
  expect(
    latestReviews([
      review(2, "CHANGES_REQUESTED", "2026-11-04"),
      review(1, "APPROVED", "2026-11-03"),
    ]).map((item) => item.state),
  ).toEqual(["CHANGES_REQUESTED"]);
});

it("keeps an approval when the same reviewer later only comments", () => {
  const user = { id: 7, login: "rev", avatar_url: "", html_url: "" };
  const review = (
    id: number,
    state: GitHubReview["state"],
    submitted_at: string,
  ): GitHubReview => ({
    id,
    state,
    submitted_at,
    user,
    body: null,
    commit_id: "abc",
  });
  expect(
    latestReviews([review(1, "APPROVED", "2026-11-03"), review(2, "COMMENTED", "2026-11-04")]).map(
      (item) => item.state,
    ),
  ).toEqual(["APPROVED"]);
  expect(
    latestReviews([review(1, "APPROVED", "2026-11-03"), review(2, "DISMISSED", "2026-11-04")]).map(
      (item) => item.state,
    ),
  ).toEqual(["DISMISSED"]);
});
