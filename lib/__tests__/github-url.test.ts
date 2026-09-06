import { describe, expect, it } from "vitest";

import { parseGitHubUrl } from "@/lib/github-url";

describe("parseGitHubUrl", () => {
  it("rejects non-github hosts and github subdomains", () => {
    expect(parseGitHubUrl("https://example.com/facebook/react")).toBeNull();
    expect(parseGitHubUrl("https://gist.github.com/abc")).toBeNull();
    expect(parseGitHubUrl("https://raw.githubusercontent.com/a/b")).toBeNull();
    expect(parseGitHubUrl("")).toBeNull();
  });

  it("works without a protocol and with www", () => {
    expect(parseGitHubUrl("github.com/torvalds/linux")).toBe(
      "/(app)/repo/torvalds~~linux",
    );
    expect(parseGitHubUrl("https://www.github.com/torvalds")).toBe(
      "/(app)/user/torvalds",
    );
  });

  it("skips github's own reserved pages", () => {
    expect(parseGitHubUrl("https://github.com/settings")).toBeNull();
    expect(parseGitHubUrl("https://github.com/marketplace")).toBeNull();
  });

  it("maps a bare user and a bare repo", () => {
    expect(parseGitHubUrl("https://github.com/torvalds")).toBe(
      "/(app)/user/torvalds",
    );
    expect(parseGitHubUrl("https://github.com/facebook/react")).toBe(
      "/(app)/repo/facebook~~react",
    );
  });

  it("strips query strings", () => {
    expect(parseGitHubUrl("https://github.com/facebook/react?tab=readme")).toBe(
      "/(app)/repo/facebook~~react",
    );
  });

  it("routes pull requests and issues", () => {
    const base = "/(app)/repo/facebook~~react";
    expect(parseGitHubUrl("https://github.com/facebook/react/pull/123")).toBe(
      `${base}/pr/123`,
    );
    expect(parseGitHubUrl("https://github.com/facebook/react/pulls")).toBe(
      `${base}/pull-requests`,
    );
    expect(parseGitHubUrl("https://github.com/facebook/react/issues/42")).toBe(
      `${base}/issue/42`,
    );
    expect(parseGitHubUrl("https://github.com/facebook/react/issues")).toBe(
      `${base}/issues`,
    );
  });

  it("routes commits, compares and releases", () => {
    const base = "/(app)/repo/facebook~~react";
    expect(parseGitHubUrl("https://github.com/facebook/react/commit/abc123")).toBe(
      `${base}/commit/abc123`,
    );
    expect(
      parseGitHubUrl("https://github.com/facebook/react/compare/main...dev"),
    ).toBe(`${base}/compare?base=main&head=dev`);
    expect(
      parseGitHubUrl("https://github.com/facebook/react/releases/tag/v1.2.3"),
    ).toBe(`${base}/release/v1.2.3`);
  });

  it("keeps the path for tree and blob, plus a blob line anchor", () => {
    const base = "/(app)/repo/facebook~~react";
    expect(
      parseGitHubUrl("https://github.com/facebook/react/tree/main/packages/core"),
    ).toBe(`${base}/files?path=packages%2Fcore`);
    expect(
      parseGitHubUrl(
        "https://github.com/facebook/react/blob/main/src/index.ts#L10",
      ),
    ).toBe(`${base}/file?path=src%2Findex.ts&fileName=index.ts&line=10`);
  });

  it("returns null for an incomplete compare range", () => {
    expect(
      parseGitHubUrl("https://github.com/facebook/react/compare/main"),
    ).toBeNull();
  });
});
