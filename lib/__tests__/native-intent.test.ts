import { describe, expect, it } from "vitest";

import { redirectSystemPath } from "@/app/+native-intent";

describe("redirectSystemPath", () => {
  it("drops the OAuth redirect on a warm start", () => {
    expect(redirectSystemPath({ path: "shikai://?code=abc123", initial: false })).toBe("");
  });

  it("keeps the OAuth redirect on a cold start", () => {
    const path = "shikai://?code=abc123";
    expect(redirectSystemPath({ path, initial: true })).toBe(path);
  });

  // Cold start: AppStack's boot replace would throw the link away, so the
  // router drops it and useDeepLinks pushes it after the replace.
  it("drops an app link on a cold start", () => {
    const path = "shikai://repo/a~~b/diff?filename=x&source=pr&number=1";
    expect(redirectSystemPath({ path, initial: true })).toBe("");
  });

  // The dev client loads the bundle itself and the path is not a route, so
  // routing it showed "Page not found".
  it.each([true, false])("drops the dev client link (initial: %s)", (initial) => {
    const path = "shikai://expo-development-client/?url=http%3A%2F%2F10.0.0.2%3A8081";
    expect(redirectSystemPath({ path, initial })).toBe("");
  });

  it.each([true, false])("drops the SDK 58 dev launcher return (initial: %s)", (initial) => {
    const path = "shikai://?__expo_url=http%3A%2F%2F10.0.0.2%3A8081";
    expect(redirectSystemPath({ path, initial })).toBe("");
  });

  const githubLinks = [
    "https://github.com/facebook/react/blob/main/README.md#L10",
    "https://www.github.com/facebook/react?code=1",
    "https://GitHub.com/facebook",
  ];

  it.each(
    githubLinks.flatMap((path) => [
      [path, true],
      [path, false],
    ]),
  )("drops %s (initial: %s)", (path, initial) => {
    expect(redirectSystemPath({ path, initial })).toBe("");
  });

  it("passes through other links", () => {
    const path = "https://github.com.evil.dev/x";
    expect(redirectSystemPath({ path, initial: false })).toBe(path);
    expect(redirectSystemPath({ path: "shikai://repo/1", initial: false })).toBe("shikai://repo/1");
  });
});
