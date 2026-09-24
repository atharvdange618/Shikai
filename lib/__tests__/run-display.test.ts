import { describe, expect, it } from "vitest";

import type { ColorTokens } from "@/constants/themes";
import { getRunDisplay } from "@/lib/run-display";

const colors = {
  success: "success",
  danger: "danger",
  warning: "warning",
  textMuted: "muted",
} as ColorTokens;

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
