import { describe, expect, it } from "vitest";

import { parseActionsJobId } from "@/lib/github-rest";

describe("parseActionsJobId", () => {
  it("extracts the job id from an Actions details_url", () => {
    expect(
      parseActionsJobId(
        "https://github.com/facebook/react/actions/runs/123/job/456",
      ),
    ).toBe(456);
  });

  it("accepts the plural /jobs/ form too", () => {
    expect(
      parseActionsJobId(
        "https://github.com/facebook/react/actions/runs/123/jobs/456",
      ),
    ).toBe(456);
  });

  it("returns null for a non-Actions details_url (external CI)", () => {
    expect(parseActionsJobId("https://circleci.com/gh/facebook/react/1")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(parseActionsJobId(null)).toBeNull();
  });
});
