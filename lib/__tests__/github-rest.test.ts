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
  fetchFollowers,
  fetchFollowing,
  fetchForks,
  fetchParticipatingNotifications,
  fetchPunchCard,
  fetchStargazers,
  fetchUserEvents,
  MAX_LIST_PAGE,
  parseActionsJobId,
  parseCheckRunId,
  searchIssues,
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

describe("searchIssues", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({ data: { items: [], total_count: 0 }, headers: {} });
  });

  it("sends the PAT, since the App token gets no results", async () => {
    await searchIssues("is:open author:@me", 1, 20, "updated", "desc", "ghp_abc");
    expect(get).toHaveBeenCalledWith("/search/issues", {
      params: { q: "is:open author:@me", page: 1, per_page: 20, sort: "updated", order: "desc" },
      headers: { Authorization: "Bearer ghp_abc" },
    });
  });
});

describe("paged list endpoints", () => {
  beforeEach(() => get.mockReset());

  const next = (page: number) => ({
    link: `<https://api.github.com/x?page=${page}>; rel="next"`,
  });

  const cases = [
    ["fetchStargazers", () => fetchStargazers("o", "r", 2, "ghp_abc"), "/repos/o/r/stargazers"],
    ["fetchForks", () => fetchForks("o", "r", 2), "/repos/o/r/forks"],
    ["fetchFollowers", () => fetchFollowers("octo cat", 2), "/users/octo%20cat/followers"],
    ["fetchFollowing", () => fetchFollowing("octo cat", 2), "/users/octo%20cat/following"],
  ] as const;

  it.each(cases)("%s hits the right path and reads the next page", async (_n, call, path) => {
    get.mockResolvedValue({ data: [{ id: 1 }], headers: next(3) });
    const result = await call();
    expect(get.mock.calls[0][0]).toBe(path);
    expect(get.mock.calls[0][1].params).toMatchObject({ page: 2, per_page: 30 });
    expect(result).toEqual({ items: [{ id: 1 }], pagination: { next: 3 } });
  });

  it("sends stargazers with the PAT, since App tokens get a 403", async () => {
    get.mockResolvedValue({ data: [], headers: {} });
    await fetchStargazers("o", "r", 1, "ghp_abc");
    expect(get.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer ghp_abc" });
  });

  it("leaves the session token in place for the other lists", async () => {
    get.mockResolvedValue({ data: [], headers: {} });
    await fetchFollowers("octocat", 1);
    expect(get.mock.calls[0][1].headers).toBeUndefined();
  });

  it("sorts forks by stars", async () => {
    get.mockResolvedValue({ data: [], headers: {} });
    await fetchForks("o", "r", 1);
    expect(get.mock.calls[0][1].params.sort).toBe("stargazers");
  });

  it("offers no next page at the page cap, where GitHub would 422", async () => {
    get.mockResolvedValue({ data: [], headers: next(MAX_LIST_PAGE + 1) });
    const result = await fetchStargazers("o", "r", MAX_LIST_PAGE, "ghp_abc");
    expect(result.pagination.next).toBeUndefined();
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

describe("fetchParticipatingNotifications", () => {
  beforeEach(() => get.mockReset());

  it("asks for participating threads with the PAT and If-None-Match", async () => {
    get.mockResolvedValue({ status: 200, data: [], headers: {} });
    await fetchParticipatingNotifications("ghp_abc", "\"etag-1\"");
    const [path, config] = get.mock.calls[0];
    expect(path).toBe("/notifications");
    expect(config.params).toEqual({ participating: true, per_page: 50 });
    expect(config.headers).toEqual({
      Authorization: "Bearer ghp_abc",
      "If-None-Match": "\"etag-1\"",
    });
  });

  it("leaves out If-None-Match when there is no ETag", async () => {
    get.mockResolvedValue({ status: 200, data: [], headers: {} });
    await fetchParticipatingNotifications("ghp_abc", null);
    expect(get.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer ghp_abc" });
  });

  it("treats 304 as a normal response, not an error", async () => {
    get.mockResolvedValue({ status: 304, data: "", headers: {} });
    await expect(fetchParticipatingNotifications("ghp_abc", "x")).resolves.toEqual({
      modified: false,
    });
    const { validateStatus } = get.mock.calls[0][1];
    expect(validateStatus(304)).toBe(true);
    expect(validateStatus(200)).toBe(true);
    expect(validateStatus(401)).toBe(false);
  });

  it("returns the threads and ETag on 200", async () => {
    const data = [{ id: "1" }];
    get.mockResolvedValue({
      status: 200,
      data,
      headers: { etag: "\"etag-2\"" },
    });
    await expect(fetchParticipatingNotifications("ghp_abc", null)).resolves.toEqual({
      modified: true,
      notifications: data,
      etag: "\"etag-2\"",
    });
  });
});
