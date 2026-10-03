import { describe, expect, it } from "vitest";

import {
  hasPartialRepoAccess,
  type GitHubInstallation,
} from "@/lib/github-rest";

function install(
  login: string,
  repository_selection: "all" | "selected",
): GitHubInstallation {
  return {
    account: { login, id: 1, type: "User" },
    repository_selection,
  } as GitHubInstallation;
}

describe("hasPartialRepoAccess", () => {
  it("is false when the user's own install covers all repos", () => {
    expect(hasPartialRepoAccess([install("octocat", "all")], "octocat")).toBe(
      false,
    );
  });

  it("is true when the user's own install covers select repos", () => {
    expect(
      hasPartialRepoAccess([install("octocat", "selected")], "octocat"),
    ).toBe(true);
  });

  it("is true when only an org has the app installed", () => {
    expect(hasPartialRepoAccess([install("acme", "all")], "octocat")).toBe(
      true,
    );
  });

  it("matches the login case-insensitively", () => {
    expect(hasPartialRepoAccess([install("OctoCat", "all")], "octocat")).toBe(
      false,
    );
  });
});
