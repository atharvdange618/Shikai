import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  GitHubCheckRun,
  GitHubCombinedStatus,
} from "@/types/github.types";

const m = vi.hoisted(() => ({
  paged: vi.fn(),
  nextRuns: vi.fn(),
  nextStatuses: vi.fn(),
  retryRuns: vi.fn(),
  retryStatuses: vi.fn(),
}));
vi.mock("@/lib/github-rest", () => ({}));
vi.mock("@/lib/query-client", () => ({
  queryKeys: { commitChecks: () => ["checks"] },
}));
vi.mock("@/hooks/useInfinitePagedQuery", () => ({
  useInfinitePagedQuery: m.paged,
}));
import { useChecks } from "@/hooks/usePullRequestDetail";

const run: GitHubCheckRun = {
  id: 1,
  name: "Build",
  status: "completed",
  conclusion: "success",
  html_url: "https://github.com/check/1",
  started_at: "2026-01-01T00:00:00Z",
  completed_at: "2026-01-01T00:01:30Z",
  app: { name: "GitHub Actions", slug: "github-actions" },
};
const status: GitHubCombinedStatus["statuses"][number] = {
  context: "external-ci",
  state: "error",
  description: null,
  target_url: "https://ci.example.com/job",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:30Z",
};
function setup(
  runs: { isError?: boolean; hasNextPage?: boolean; isLoading?: boolean } = {},
  statuses: {
    isError?: boolean;
    hasNextPage?: boolean;
    isLoading?: boolean;
  } = {},
) {
  const base = {
    isError: false,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
  };
  m.paged.mockReturnValueOnce({
    ...base,
    ...runs,
    items: runs.isError ? [] : [run],
    data: runs.isError ? undefined : { pages: [{ total: 140 }] },
    fetchNextPage: m.nextRuns,
    refetch: m.retryRuns,
  });
  m.paged.mockReturnValueOnce({
    ...base,
    ...statuses,
    items: statuses.isError ? [] : [status],
    data: statuses.isError ? undefined : { pages: [{ total_count: 3 }] },
    fetchNextPage: m.nextStatuses,
    refetch: m.retryStatuses,
  });
  return useChecks("owner", "repo", "sha");
}
beforeEach(() => vi.clearAllMocks());
describe("combined checks paging", () => {
  it("retains legacy error results and native run destinations", () => {
    expect(setup().data).toEqual([
      expect.objectContaining({
        key: "check-1",
        runId: 1,
        conclusion: "success",
        status: "completed",
        app: "GitHub Actions",
        completedAt: "2026-01-01T00:01:30Z",
      }),
      expect.objectContaining({
        key: "status-external-ci",
        conclusion: "error",
        url: status.target_url,
        status: "completed",
        startedAt: "2026-01-01T00:00:00Z",
        completedAt: "2026-01-01T00:00:30Z",
      }),
    ]);
  });
  it("reads a pending legacy status as a run in flight", () => {
    status.state = "pending";
    expect(setup().data[1]).toMatchObject({
      conclusion: "pending",
      status: "in_progress",
    });
    status.state = "error";
  });
  it("keeps available rows when the other CI source fails", () => {
    const query = setup({}, { isError: true });
    expect(query.data).toHaveLength(1);
    expect(query.isError).toBe(true);
  });
  it("retries a failed source while paging the working source", async () => {
    await setup({ hasNextPage: true }, { isError: true }).fetchNextPage();
    expect(m.nextRuns).toHaveBeenCalledOnce();
    expect(m.retryStatuses).toHaveBeenCalledOnce();
    expect(m.nextStatuses).not.toHaveBeenCalled();
  });
  it("keeps paging legacy statuses after Actions pages finish", async () => {
    const query = setup({}, { hasNextPage: true });
    expect(query.hasNextPage).toBe(true);
    await query.fetchNextPage();
    expect(m.nextStatuses).toHaveBeenCalledOnce();
    expect(m.nextRuns).not.toHaveBeenCalled();
  });
  it("reports GitHub's total across both sources once both have loaded", () => {
    expect(setup({ hasNextPage: true }).total).toBe(143);
    expect(setup({}, { isError: true }).total).toBeUndefined();
  });
  it("reports loading until both CI sources finish", () => {
    expect(setup({}, { isLoading: true }).isLoading).toBe(true);
  });
});
