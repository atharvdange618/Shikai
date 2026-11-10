import { describe, expect, it } from "vitest";

import type { ColorTokens } from "@/constants/themes";
import { formatJobLogTail, getCheckDisplay, getRunDisplay } from "@/lib/run-display";

const colors = {
  success: "success",
  danger: "danger",
  warning: "warning",
  textMuted: "muted",
} as ColorTokens;

it("shows only the last 100 job log lines without ANSI colors", () => {
  const lines = Array.from({ length: 101 }, (_, index) => `line ${index}`);
  const log = `${lines[0]}\n\u001b[31;1m${lines.slice(1).join("\n")}\u001b[0m\n`;

  expect(formatJobLogTail(log)).toBe(lines.slice(1).join("\n"));
});

describe("getRunDisplay", () => {
  it("separates queued from in progress", () => {
    expect(getRunDisplay("queued", null, colors).label).toBe("Queued");
    expect(getRunDisplay("waiting", null, colors).label).toBe("Queued");
    expect(getRunDisplay("in_progress", null, colors).label).toBe("In progress");
  });

  it("maps completed conclusions to pass, fail, cancel and skip", () => {
    expect(getRunDisplay("completed", "success", colors)).toMatchObject({
      label: "Passed",
      color: "success",
    });
    expect(getRunDisplay("completed", "startup_failure", colors)).toMatchObject({
      label: "Failed",
      color: "danger",
    });
    expect(getRunDisplay("completed", "cancelled", colors).label).toBe("Cancelled");
    expect(getRunDisplay("completed", "stale", colors).label).toBe("Skipped");
  });
});

describe("getCheckDisplay", () => {
  it("treats the merged list's pseudo conclusions as running and failed", () => {
    expect(getCheckDisplay("in_progress", "pending", colors)).toMatchObject({
      label: "In progress",
      color: "warning",
    });
    expect(getCheckDisplay("completed", "error", colors)).toMatchObject({
      label: "Failed",
      color: "danger",
    });
  });

  it("defers to the run mapping for real conclusions", () => {
    expect(getCheckDisplay("completed", "success", colors).label).toBe("Passed");
    expect(getCheckDisplay("completed", "neutral", colors).label).toBe("Skipped");
  });
});
