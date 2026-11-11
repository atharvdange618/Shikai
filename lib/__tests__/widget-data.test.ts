import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { reportApiError } = vi.hoisted(() => ({ reportApiError: vi.fn() }));
vi.mock("@/lib/sentry", () => ({ reportApiError }));
vi.mock("@/lib/secure-storage", () => ({
  getStoredToken: vi.fn().mockResolvedValue("gho_test"),
}));

import { fetchContributionsForWidget } from "@/lib/widget-data";

function stubFetch(status: number, body: unknown = {}) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

describe("fetchContributionsForWidget", () => {
  beforeEach(() => reportApiError.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("reports a failed response to Sentry and returns null", async () => {
    stubFetch(502);
    await expect(fetchContributionsForWidget()).resolves.toBeNull();
    expect(reportApiError).toHaveBeenCalledWith(502, "POST", "https://api.github.com/graphql");
  });

  it("gives the request a timeout signal", async () => {
    stubFetch(502);
    await fetchContributionsForWidget();
    const init = vi.mocked(fetch).mock.calls[0][1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects when the request times out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("signal timed out", "TimeoutError")),
    );
    await expect(fetchContributionsForWidget()).rejects.toThrow("signal timed out");
    expect(reportApiError).not.toHaveBeenCalled();
  });

  it("does not report a successful response", async () => {
    stubFetch(200, {
      data: {
        viewer: {
          contributionsCollection: {
            contributionCalendar: { totalContributions: 0, weeks: [] },
          },
        },
      },
    });
    const data = await fetchContributionsForWidget();
    expect(data?.totalContributions).toBe(0);
    expect(reportApiError).not.toHaveBeenCalled();
  });

  it("returns no widget data when the response has no calendar", async () => {
    stubFetch(200, { data: { viewer: null } });
    await expect(fetchContributionsForWidget()).resolves.toBeNull();
  });
});
