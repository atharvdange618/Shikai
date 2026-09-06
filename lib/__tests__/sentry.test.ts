import { describe, expect, it, vi } from "vitest";

// scrubEvent uses no Sentry runtime, only the Event type. Stub the native
// package so importing lib/sentry works under Node.
vi.mock("@sentry/react-native", () => ({}));

import { scrubEvent } from "@/lib/sentry";

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
