import type { Octicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import type { ColorTokens } from "@/constants/themes";
import type {
  GitHubCheckConclusion,
  GitHubWorkflowRunConclusion,
  GitHubWorkflowRunStatus,
} from "@/types/github.types";

export interface RunDisplay {
  icon: ComponentProps<typeof Octicons>["name"];
  color: string;
  label: string;
}

/**
 * Display for a row of the merged PR check list, which carries two
 * pseudo-conclusions GitHub itself never reports: `pending` for a run in flight
 * and `error` for a legacy status that failed.
 */
export function getCheckDisplay(
  status: GitHubWorkflowRunStatus,
  conclusion: GitHubCheckConclusion | "pending" | "error",
  colors: ColorTokens,
): RunDisplay {
  if (conclusion === "pending") return getRunDisplay(status, null, colors);
  if (conclusion === "error") return getRunDisplay(status, "failure", colors);
  return getRunDisplay(status, conclusion, colors);
}

// Shared by check runs, workflow runs and workflow jobs: the check types are
// subsets of the workflow ones, so one mapping covers all three.
export function getRunDisplay(
  status: GitHubWorkflowRunStatus,
  conclusion: GitHubWorkflowRunConclusion,
  colors: ColorTokens,
): RunDisplay {
  if (status === "in_progress") {
    return { icon: "clock", color: colors.warning, label: "In progress" };
  }
  if (status !== "completed") {
    return { icon: "clock", color: colors.warning, label: "Queued" };
  }
  switch (conclusion) {
    case "success":
      return { icon: "check-circle-fill", color: colors.success, label: "Passed" };
    case "failure":
    case "timed_out":
    case "action_required":
    case "startup_failure":
      return { icon: "x-circle-fill", color: colors.danger, label: "Failed" };
    case "cancelled":
      return { icon: "skip", color: colors.textMuted, label: "Cancelled" };
    case "skipped":
    case "neutral":
    case "stale":
      return { icon: "skip", color: colors.textMuted, label: "Skipped" };
    default:
      return { icon: "dot-fill", color: colors.textMuted, label: "Completed" };
  }
}
