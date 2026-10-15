import { beforeEach, describe, expect, it, vi } from "vitest";

const { GitHubApiError, isRateLimited } = vi.hoisted(() => ({
  GitHubApiError: class GitHubApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
  isRateLimited: vi.fn(() => false),
}));
vi.mock("@/lib/axios", () => ({ GitHubApiError, isRateLimited }));
vi.mock("react-native", () => ({ AppState: {} }));

import { defaultRetry, statsRetry, statsRetryDelay } from "@/lib/query-client";

const pending = new GitHubApiError(202, "computing");
const notFound = new GitHubApiError(404, "missing");
const serverError = new GitHubApiError(500, "boom");

beforeEach(() => isRateLimited.mockReturnValue(false));

describe("defaultRetry", () => {
  it("never retries 401 or 404", () => {
    expect(defaultRetry(0, new GitHubApiError(401, "x"))).toBe(false);
    expect(defaultRetry(0, notFound)).toBe(false);
  });

  it("does not retry a 403 while rate limited", () => {
    isRateLimited.mockReturnValue(true);
    expect(defaultRetry(0, new GitHubApiError(403, "x"))).toBe(false);
  });

  it("retries other errors twice", () => {
    expect(defaultRetry(1, serverError)).toBe(true);
    expect(defaultRetry(2, serverError)).toBe(false);
  });
});

describe("statsRetry", () => {
  it("keeps retrying a 202 for 5 attempts", () => {
    expect(statsRetry(4, pending)).toBe(true);
    expect(statsRetry(5, pending)).toBe(false);
  });

  it("falls back to the default rules for other errors", () => {
    expect(statsRetry(0, notFound)).toBe(false);
    expect(statsRetry(2, serverError)).toBe(false);
  });
});

describe("statsRetryDelay", () => {
  it("waits a flat 3s on a 202", () => {
    expect(statsRetryDelay(0, pending)).toBe(3000);
    expect(statsRetryDelay(4, pending)).toBe(3000);
  });

  it("backs off exponentially for other errors, capped at 30s", () => {
    expect(statsRetryDelay(0, serverError)).toBe(1000);
    expect(statsRetryDelay(2, serverError)).toBe(4000);
    expect(statsRetryDelay(10, serverError)).toBe(30_000);
  });
});
