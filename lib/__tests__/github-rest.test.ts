import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, GitHubApiError } = vi.hoisted(() => ({
  get: vi.fn(),
  GitHubApiError: class GitHubApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));
vi.mock("@/lib/axios", () => ({ githubAxios: { get }, GitHubApiError }));

import {
  fetchCommitActivity,
  fetchContributorStats,
  fetchPunchCard,
  fetchUserEvents,
  parseActionsJobId,
  parseCheckRunId,
} from "@/lib/github-rest";

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

describe("parseCheckRunId", () => {
  it("extracts the id from a job's check_run_url", () => {
    expect(
      parseCheckRunId(
        "https://api.github.com/repos/facebook/react/check-runs/789",
      ),
    ).toBe(789);
  });

  it("returns null for an unrelated url or null", () => {
    expect(parseCheckRunId("https://api.github.com/repos/a/b/actions/jobs/1")).toBeNull();
    expect(parseCheckRunId(null)).toBeNull();
  });
});

describe("fetchUserEvents", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({ data: [], headers: {} });
  });

  it("sends the PAT so private events come back", async () => {
    await fetchUserEvents("octocat", 1, 20, "ghp_abc");
    expect(get).toHaveBeenCalledWith("/users/octocat/events", {
      params: { page: 1, per_page: 20 },
      headers: { Authorization: "Bearer ghp_abc" },
    });
  });

  it("leaves auth to the session token when there is no PAT", async () => {
    await fetchUserEvents("octocat", 1, 20, null);
    expect(get.mock.calls[0][1].headers).toBeUndefined();
  });
});

describe("stats endpoints", () => {
  beforeEach(() => get.mockReset());

  const cases = [
    ["fetchCommitActivity", fetchCommitActivity, "commit_activity"],
    ["fetchContributorStats", fetchContributorStats, "contributors"],
    ["fetchPunchCard", fetchPunchCard, "punch_card"],
  ] as const;

  describe.each(cases)("%s", (_name, fetcher, stat) => {
    it("hits the matching /stats path", async () => {
      get.mockResolvedValue({ status: 200, data: [] });
      await fetcher("facebook", "react");
      expect(get.mock.calls[0][0]).toBe(`/repos/facebook/react/stats/${stat}`);
    });

    it("returns the body on 200", async () => {
      const body = [{ some: "row" }];
      get.mockResolvedValue({ status: 200, data: body });
      await expect(fetcher("facebook", "react")).resolves.toBe(body);
    });

    it("throws a 202 GitHubApiError while GitHub computes the stats", async () => {
      get.mockResolvedValue({ status: 202, data: {} });
      const error = await fetcher("facebook", "react").catch((e: unknown) => e);
      expect(error).toBeInstanceOf(GitHubApiError);
      expect((error as InstanceType<typeof GitHubApiError>).status).toBe(202);
    });

    it("returns an empty array on 204 (repo has no commits)", async () => {
      get.mockResolvedValue({ status: 204, data: "" });
      await expect(fetcher("facebook", "react")).resolves.toEqual([]);
    });
  });
});
