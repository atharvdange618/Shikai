import { beforeEach, describe, expect, it, vi } from "vitest";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/axios", () => ({
  githubAxios: { get },
  GitHubApiError: class extends Error {},
}));
import {
  fetchCheckRuns,
  fetchCombinedStatus,
  fetchIssueComments,
  fetchIssueTimelinePage,
  fetchPullRequestCommits,
  fetchPullRequestReviewComments,
  fetchPullRequestReviews,
} from "@/lib/github-rest";

beforeEach(() => vi.clearAllMocks());
const link = '<https://api.github.com/next?page=3&per_page=100>; rel="next"';
describe("PR paging", () => {
  it("pages general conversation and activity without truncating either stream", async () => {
    get.mockResolvedValue({ data: [], headers: { link } });
    expect(
      (await fetchIssueComments("org", "repo", 42, 2, 100)).pagination.next,
    ).toBe(3);
    expect(
      (await fetchIssueTimelinePage("org", "repo", 42, 2)).pagination.next,
    ).toBe(3);
    expect(get).toHaveBeenLastCalledWith("/repos/org/repo/issues/42/timeline", {
      params: { page: 2, per_page: 100 },
    });
  });
  it.each([
    ["commits", fetchPullRequestCommits],
    ["reviews", fetchPullRequestReviews],
    ["comments", fetchPullRequestReviewComments],
  ] as const)(
    "requests later %s pages and exposes the next page",
    async (resource, fetch) => {
      get.mockResolvedValue({ data: [], headers: { link } });
      const result = await fetch("org", "repo", 42, 2);
      expect(get).toHaveBeenCalledWith(`/repos/org/repo/pulls/42/${resource}`, {
        params: { page: 2, per_page: 100 },
      });
      expect(result.pagination.next).toBe(3);
    },
  );
  it("honors the 250 PR commit limit even if GitHub sends a next link", async () => {
    get.mockResolvedValue({
      data: Array.from({ length: 100 }, (_, id) => ({ sha: String(id) })),
      headers: { link },
    });
    const result = await fetchPullRequestCommits("org", "repo", 42, 3);
    expect(result.commits).toHaveLength(50);
    expect(result.pagination.next).toBeUndefined();
  });
  it("pages latest check runs without discarding their total", async () => {
    get.mockResolvedValue({
      data: { check_runs: [{ id: 101 }], total_count: 205 },
      headers: { link },
    });
    const result = await fetchCheckRuns("org", "repo", "sha", 2);
    expect(get).toHaveBeenCalledWith("/repos/org/repo/commits/sha/check-runs", {
      params: { page: 2, per_page: 100, filter: "latest" },
    });
    expect(result).toMatchObject({
      runs: [{ id: 101 }],
      total: 205,
      pagination: { next: 3 },
    });
  });
  it("pages legacy CI statuses as well as Actions runs", async () => {
    get.mockResolvedValue({
      data: {
        state: "failure",
        statuses: [{ context: "external-ci", state: "error" }],
        total_count: 205,
      },
      headers: { link },
    });
    expect(await fetchCombinedStatus("org", "repo", "sha", 2)).toMatchObject({
      statuses: [{ context: "external-ci", state: "error" }],
      pagination: { next: 3 },
    });
    expect(get).toHaveBeenCalledWith("/repos/org/repo/commits/sha/status", {
      params: { page: 2, per_page: 100 },
    });
  });
});
