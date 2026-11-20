import { beforeEach, describe, expect, it, vi } from "vitest";

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  validateStatus?: (status: number) => boolean;
}

const { get, GitHubApiError } = vi.hoisted(() => ({
  get: vi.fn<(path: string, options?: RequestOptions) => Promise<unknown>>(),
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
  fetchFileContent,
  fetchFileTree,
  fetchFollowers,
  fetchFollowing,
  fetchForks,
  fetchParticipatingNotifications,
  fetchPreviousReleaseTag,
  fetchPullRequestFiles,
  fetchPunchCard,
  fetchStargazers,
  fetchUserEvents,
  fetchWorkflowRun,
  fetchWorkflowRunJobs,
  MAX_LIST_PAGE,
  parseActionsJobId,
  parseCheckRunId,
  searchIssues,
} from "@/lib/github-rest";

describe("previous release tag", () => {
  beforeEach(() => get.mockReset());

  it("finds the predecessor of a release opened directly on a later page", async () => {
    get
      .mockResolvedValueOnce({
        data: [{ tag_name: "v4" }],
        headers: { link: '<https://api.github.com/repos/o/r/releases?page=2>; rel="next"' },
      })
      .mockResolvedValueOnce({
        data: [{ tag_name: "v3" }, { tag_name: "v2" }],
        headers: { link: '<https://api.github.com/repos/o/r/releases?page=3>; rel="next"' },
      });

    await expect(fetchPreviousReleaseTag("o", "r", "v3")).resolves.toBe("v2");
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("crosses a page boundary and skips drafts", async () => {
    get
      .mockResolvedValueOnce({
        data: [{ tag_name: "v3" }],
        headers: { link: '<https://api.github.com/repos/o/r/releases?page=2>; rel="next"' },
      })
      .mockResolvedValueOnce({
        data: [{ tag_name: "draft", draft: true }, { tag_name: "v2" }],
        headers: {},
      });

    await expect(fetchPreviousReleaseTag("o", "r", "v3")).resolves.toBe("v2");
    expect(get).toHaveBeenLastCalledWith("/repos/o/r/releases", {
      params: { page: 2, per_page: 100 },
    });
  });

  it("returns no comparison for the oldest release", async () => {
    get.mockResolvedValueOnce({ data: [{ tag_name: "v1" }], headers: {} });
    await expect(fetchPreviousReleaseTag("o", "r", "v1")).resolves.toBeNull();
  });
});

describe("workflow run jobs", () => {
  beforeEach(() => get.mockReset());

  it("follows the next page while keeping both pages on the selected attempt", async () => {
    const endpoint = "/repos/o/r/actions/runs/42/attempts/2/jobs";
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ id: index + 1 }));
    const lastJob = { id: 101, check_run_url: "https://api.github.com/repos/o/r/check-runs/101" };
    get
      .mockResolvedValueOnce({
        data: { jobs: firstPage },
        headers: { link: `<https://api.github.com${endpoint}?page=2>; rel="next"` },
      })
      .mockResolvedValueOnce({ data: { jobs: [lastJob] }, headers: {} });

    const first = await fetchWorkflowRunJobs("o", "r", 42, 2, 1);
    expect(first.jobs).toHaveLength(100);
    expect(first.pagination.next).toBe(2);
    const second = await fetchWorkflowRunJobs("o", "r", 42, 2, first.pagination.next ?? 1);
    expect(second.jobs).toEqual([lastJob]);
    expect(second.pagination.next).toBeUndefined();
    expect(get).toHaveBeenNthCalledWith(1, endpoint, { params: { page: 1, per_page: 100 } });
    expect(get).toHaveBeenNthCalledWith(2, endpoint, { params: { page: 2, per_page: 100 } });
  });

  it("loads the matching run metadata when a link selects an attempt", async () => {
    const run = { id: 42, run_attempt: 2 };
    get.mockResolvedValueOnce({ data: run });
    await expect(fetchWorkflowRun("o", "r", 42, 2)).resolves.toBe(run);
    expect(get).toHaveBeenCalledExactlyOnceWith("/repos/o/r/actions/runs/42/attempts/2");
  });
});

describe("repository files", () => {
  beforeEach(() => get.mockReset());

  it("requests file content on the given ref", async () => {
    get.mockResolvedValueOnce({ data: { type: "file" } });
    await fetchFileContent("o", "r", "src/main.ts", "release/next");
    expect(get).toHaveBeenCalledWith("/repos/o/r/contents/src%2Fmain.ts", {
      params: { ref: "release/next" },
    });
  });

  it("loads a tree by commit SHA", async () => {
    const sha = "a".repeat(40);
    const tree = { tree: [], truncated: false };
    get.mockResolvedValueOnce({ data: tree });

    await expect(fetchFileTree("o", "r", sha)).resolves.toBe(tree);
    expect(get).toHaveBeenCalledExactlyOnceWith(`/repos/o/r/git/trees/${sha}`, {
      params: { recursive: 1 },
    });
  });
});

describe("parseActionsJobId", () => {
  it("extracts the job id from an Actions details_url", () => {
    expect(parseActionsJobId("https://github.com/facebook/react/actions/runs/123/job/456")).toBe(
      456,
    );
  });

  it("accepts the plural /jobs/ form too", () => {
    expect(parseActionsJobId("https://github.com/facebook/react/actions/runs/123/jobs/456")).toBe(
      456,
    );
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
    expect(parseCheckRunId("https://api.github.com/repos/facebook/react/check-runs/789")).toBe(789);
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
    expect(get.mock.calls[0][1]?.headers).toBeUndefined();
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

  it("ignores a non-string Link header", async () => {
    get.mockResolvedValue({ data: [], headers: { link: 42 } });

    const result = await fetchPullRequestFiles("o", "r", 1);

    expect(result.pagination).toEqual({});
  });

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
    expect(get.mock.calls[0][1]?.params).toMatchObject({ page: 2, per_page: 30 });
    expect(result).toEqual({ items: [{ id: 1 }], pagination: { next: 3 } });
  });

  it("sends stargazers with the PAT, since App tokens get a 403", async () => {
    get.mockResolvedValue({ data: [], headers: {} });
    await fetchStargazers("o", "r", 1, "ghp_abc");
    expect(get.mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer ghp_abc" });
  });

  it("leaves the session token in place for the other lists", async () => {
    get.mockResolvedValue({ data: [], headers: {} });
    await fetchFollowers("octocat", 1);
    expect(get.mock.calls[0][1]?.headers).toBeUndefined();
  });

  it("sorts forks by stars", async () => {
    get.mockResolvedValue({ data: [], headers: {} });
    await fetchForks("o", "r", 1);
    expect(get.mock.calls[0][1]?.params?.sort).toBe("stargazers");
  });

  it("offers no next page at the page cap, where GitHub would 422", async () => {
    get.mockResolvedValue({ data: [], headers: next(MAX_LIST_PAGE + 1) });
    const result = await fetchStargazers("o", "r", MAX_LIST_PAGE, "ghp_abc");
    expect(result.pagination.next).toBeUndefined();
  });

  it("pages PR files so diffs past the first page can load", async () => {
    get.mockResolvedValue({ data: [{ filename: "a.ts" }], headers: next(3) });
    const result = await fetchPullRequestFiles("o", "r", 7, 2, 100);
    expect(get.mock.calls[0][0]).toBe("/repos/o/r/pulls/7/files");
    expect(get.mock.calls[0][1]?.params).toEqual({ page: 2, per_page: 100 });
    expect(result).toEqual({ files: [{ filename: "a.ts" }], pagination: { next: 3 } });
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
    await fetchParticipatingNotifications("ghp_abc", '"etag-1"');
    const [path, config] = get.mock.calls[0];
    expect(path).toBe("/notifications");
    expect(config?.params).toEqual({ participating: true, per_page: 50 });
    expect(config?.headers).toEqual({
      Authorization: "Bearer ghp_abc",
      "If-None-Match": '"etag-1"',
    });
  });

  it("leaves out If-None-Match when there is no ETag", async () => {
    get.mockResolvedValue({ status: 200, data: [], headers: {} });
    await fetchParticipatingNotifications("ghp_abc", null);
    expect(get.mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer ghp_abc" });
  });

  it("treats 304 as a normal response, not an error", async () => {
    get.mockResolvedValue({ status: 304, data: "", headers: {} });
    await expect(fetchParticipatingNotifications("ghp_abc", "x")).resolves.toEqual({
      modified: false,
    });
    const validateStatus = get.mock.calls[0][1]?.validateStatus;
    expect(validateStatus?.(304)).toBe(true);
    expect(validateStatus?.(200)).toBe(true);
    expect(validateStatus?.(401)).toBe(false);
  });

  it("returns the threads and ETag on 200", async () => {
    const data = [{ id: "1" }];
    get.mockResolvedValue({
      status: 200,
      data,
      headers: { etag: '"etag-2"' },
    });
    await expect(fetchParticipatingNotifications("ghp_abc", null)).resolves.toEqual({
      modified: true,
      notifications: data,
      etag: '"etag-2"',
    });
  });
});
