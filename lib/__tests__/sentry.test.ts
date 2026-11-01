import { beforeEach, describe, expect, it, vi } from "vitest";

// Stub the native package so importing lib/sentry works under Node.
const { captureMessage } = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/react-native", () => ({ captureMessage }));

import { apiEndpoint, reportApiError, scrubEvent } from "@/lib/sentry";

const OAUTH = "gho_0123456789abcdefghijklmnopqrstuvwx";
const FINE_PAT = "github_pat_0123456789abcdefghij0123456789";

describe("scrubEvent", () => {
  it("redacts a token in the top-level message", () => {
    const out = scrubEvent({ message: `auth failed for ${OAUTH}` });
    expect(out.message).toBe("auth failed for [redacted-token]");
  });

  it("leaves token-free text untouched", () => {
    const out = scrubEvent({ message: "plain network error" });
    expect(out.message).toBe("plain network error");
  });

  it("drops request headers entirely", () => {
    const out = scrubEvent({
      request: { headers: { Authorization: `Bearer ${OAUTH}` } },
    });
    expect(out.request?.headers).toBeUndefined();
  });

  it("redacts tokens in exception values", () => {
    const out = scrubEvent({
      exception: { values: [{ value: `boom ${FINE_PAT}` }] },
    });
    expect(out.exception?.values?.[0]?.value).toBe("boom [redacted-token]");
  });

  it("redacts breadcrumb message and string data", () => {
    const out = scrubEvent({
      breadcrumbs: [
        { message: `GET with ${OAUTH}`, data: { url: `x?t=${OAUTH}`, n: 1 } },
      ],
    });
    const crumb = out.breadcrumbs?.[0];
    expect(crumb?.message).toBe("GET with [redacted-token]");
    expect(crumb?.data?.url).toBe("x?t=[redacted-token]");
    expect(crumb?.data?.n).toBe(1);
  });

  it("returns the same object it was given", () => {
    const event = { message: "hi" };
    expect(scrubEvent(event)).toBe(event);
  });
});

describe("apiEndpoint", () => {
  it("replaces owner, repo and ids, and drops the query", () => {
    expect(apiEndpoint("/repos/octocat/hello/pulls/7/files?page=2")).toBe(
      "/repos/:x/:x/pulls/:x/files",
    );
  });

  it("strips the origin from a full pagination URL", () => {
    expect(apiEndpoint("https://api.github.com/users/octocat/repos")).toBe(
      "/users/:x/repos",
    );
  });

  it("keeps a path with no identifiers as-is", () => {
    expect(apiEndpoint("/search/issues")).toBe("/search/issues");
  });
});

describe("reportApiError", () => {
  beforeEach(() => captureMessage.mockClear());

  it("reports a 5xx tagged by status and endpoint", () => {
    reportApiError(502, "get", "/repos/octocat/hello");
    expect(captureMessage).toHaveBeenCalledWith(
      "GitHub 502 on GET /repos/:x/:x",
      expect.objectContaining({
        tags: { "http.status_code": "502", endpoint: "/repos/:x/:x" },
      }),
    );
  });

  it("reports an unexpected 4xx", () => {
    reportApiError(400, "post", "/graphql");
    expect(captureMessage).toHaveBeenCalledOnce();
  });

  it.each([0, 401, 403, 404, 409, 410, 422, 451])(
    "skips expected status %i",
    (status) => {
      reportApiError(status, "get", "/user");
      expect(captureMessage).not.toHaveBeenCalled();
    },
  );
});
