import { describe, expect, it } from "vitest";

import { redirectSystemPath } from "@/app/+native-intent";

describe("redirectSystemPath", () => {
  it("drops the OAuth redirect on a warm start", () => {
    expect(
      redirectSystemPath({ path: "shikai://?code=abc123", initial: false }),
    ).toBe("");
  });

  it("keeps the OAuth redirect on a cold start", () => {
    const path = "shikai://?code=abc123";
    expect(redirectSystemPath({ path, initial: true })).toBe(path);
  });

  it("passes through other links", () => {
    const path = "https://github.com/facebook/react?code=1";
    expect(redirectSystemPath({ path, initial: false })).toBe(path);
    expect(
      redirectSystemPath({ path: "shikai://repo/1", initial: false }),
    ).toBe("shikai://repo/1");
  });
});
