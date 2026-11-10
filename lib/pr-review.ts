import type { CheckSummaryItem } from "@/hooks/usePullRequestDetail";
import type { GitHubReview, GitHubReviewComment } from "@/types/github.types";

export function buildThreads(comments: GitHubReviewComment[]) {
  const replies = new Map<number, GitHubReviewComment[]>();
  for (const comment of comments) {
    if (!comment.in_reply_to_id) continue;
    const list = replies.get(comment.in_reply_to_id) ?? [];
    list.push(comment);
    replies.set(comment.in_reply_to_id, list);
  }
  return comments
    .filter((comment) => !comment.in_reply_to_id)
    .sort((a, b) => a.path.localeCompare(b.path) || a.created_at.localeCompare(b.created_at))
    .map((root) => ({
      path: root.path,
      line: root.line ?? root.original_line,
      diffHunk: root.diff_hunk,
      root,
      replies: (replies.get(root.id) ?? []).sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      ),
    }));
}

export type CheckGroup =
  "Needs attention" | "Running" | "Passed" | "Skipped" | "Cancelled" | "Neutral" | "Unknown";
export const CHECK_GROUPS: CheckGroup[] = [
  "Needs attention",
  "Running",
  "Unknown",
  "Passed",
  "Skipped",
  "Cancelled",
  "Neutral",
];

export function checkGroup(conclusion: CheckSummaryItem["conclusion"]): CheckGroup {
  switch (conclusion) {
    case "failure":
    case "error":
    case "timed_out":
    case "action_required":
      return "Needs attention";
    case "pending":
      return "Running";
    case "success":
      return "Passed";
    case "skipped":
      return "Skipped";
    case "cancelled":
      return "Cancelled";
    case "neutral":
      return "Neutral";
    default:
      return "Unknown";
  }
}

export function checksSummary(
  checks: CheckSummaryItem[],
  loading: boolean,
  error: boolean,
  partial: boolean,
) {
  const failing = checks.filter(
    (check) => checkGroup(check.conclusion) === "Needs attention",
  ).length;
  const running = checks.filter((check) => checkGroup(check.conclusion) === "Running").length;
  if (failing)
    return `${failing} need attention${running ? ` · ${running} running` : ""}${error || partial || loading ? " · partial results" : ""}`;
  if (error) return checks.length ? "Checks partly unavailable" : "Checks unavailable";
  if (loading) return "Loading checks…";
  if (partial) return `${checks.length} checks loaded · more available`;
  if (!checks.length) return "No checks reported";
  if (running) return `${running} running`;
  if (checks.every((check) => check.conclusion === "success")) return "All checks passed";
  return `${checks.filter((check) => check.conclusion === "success").length} passed · ${checks.length} total · see results`;
}

export function checksIcon(
  checks: CheckSummaryItem[],
  loading: boolean,
  error: boolean,
  partial: boolean,
) {
  if (checks.some((check) => checkGroup(check.conclusion) === "Needs attention")) return "x-circle";
  if (error) return "alert";
  if (loading || partial || checks.some((check) => check.conclusion === "pending")) return "clock";
  return checks.length > 0 && checks.every((check) => check.conclusion === "success")
    ? "check-circle"
    : "circle-slash";
}

// A comment-only review leaves the reviewer's earlier approval or change
// request in force on GitHub, so it only counts when there is no decision yet.
const isDecision = (review: GitHubReview) =>
  review.state !== "COMMENTED" && review.state !== "PENDING";

export function latestReviews(reviews: GitHubReview[]) {
  const byUser = new Map<number, GitHubReview>();
  for (const review of reviews) {
    const previous = byUser.get(review.user.id);
    if (!previous) {
      byUser.set(review.user.id, review);
      continue;
    }
    if (isDecision(previous) && !isDecision(review)) continue;
    if (
      (isDecision(review) && !isDecision(previous)) ||
      (review.submitted_at ?? "") >= (previous.submitted_at ?? "")
    )
      byUser.set(review.user.id, review);
  }
  return [...byUser.values()];
}
