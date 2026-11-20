import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

const TOKEN_RE = /\b(gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,})\b/g;

function redact(value: string): string {
  return value.replace(TOKEN_RE, "[redacted-token]");
}

/**
 * Remove the GitHub token from an outgoing event. Covers the realistic leak
 * paths: request headers, exception messages, the top-level message, and
 * breadcrumb text/data. Exported for the dev self-check below.
 */
export function scrubEvent<T extends Sentry.Event>(event: T): T {
  if (event.request?.headers) {
    delete event.request.headers;
  }

  if (event.message) {
    event.message = redact(event.message);
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) {
      exception.value = redact(exception.value);
    }
  }

  for (const crumb of event.breadcrumbs ?? []) {
    if (typeof crumb.message === "string") {
      crumb.message = redact(crumb.message);
    }
    if (crumb.data) {
      for (const key of Object.keys(crumb.data)) {
        const val: unknown = crumb.data[key];
        if (typeof val === "string") {
          crumb.data[key] = redact(val);
        }
      }
    }
  }

  return event;
}

if (__DEV__) {
  const probe = scrubEvent({
    message: "token ghp_0123456789abcdefghijklmnopqrstuvwxyz leaked",
    exception: {
      values: [{ value: "failed with github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345" }],
    },
  });
  if (
    probe.message?.includes("ghp_") ||
    probe.exception?.values?.[0]?.value?.includes("github_pat_")
  ) {
    throw new Error("lib/sentry: scrubEvent failed to redact a GitHub token");
  }
}

export function initSentry(): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: !__DEV__,
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
    beforeSend: scrubEvent,
  });
}

const EXPECTED_STATUSES = new Set([0, 401, 403, 404, 409, 410, 422, 429, 451]);

const DEDUPE_MS = 60_000;
const lastSent = new Map<string, number>();

const ENDPOINT_WORDS = new Set([
  "actions",
  "annotations",
  "branches",
  "check-runs",
  "comments",
  "commits",
  "compare",
  "contents",
  "contributors",
  "events",
  "files",
  "followers",
  "following",
  "forks",
  "gists",
  "git",
  "graphql",
  "installations",
  "issues",
  "jobs",
  "languages",
  "logs",
  "notifications",
  "pulls",
  "readme",
  "received_events",
  "releases",
  "repos",
  "repositories",
  "requested_reviewers",
  "reviews",
  "runs",
  "search",
  "social_accounts",
  "starred",
  "stargazers",
  "stats",
  "status",
  "tags",
  "threads",
  "timeline",
  "trees",
  "user",
  "users",
]);

/** `/repos/octocat/hello/pulls/7?page=2` → `/repos/:x/:x/pulls/:x` */
export function apiEndpoint(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0];
  return path
    .split("/")
    .map((seg) => (seg === "" || ENDPOINT_WORDS.has(seg) ? seg : ":x"))
    .join("/");
}

export function reportApiError(
  status: number,
  method: string | undefined,
  url: string | undefined,
): void {
  if (EXPECTED_STATUSES.has(status)) return;

  const verb = (method ?? "get").toUpperCase();
  const endpoint = apiEndpoint(url ?? "");

  const key = `${verb} ${endpoint} ${status}`;
  const now = Date.now();
  const last = lastSent.get(key);
  if (last !== undefined && now - last < DEDUPE_MS) return;
  lastSent.set(key, now);

  Sentry.captureMessage(`GitHub ${status} on ${verb} ${endpoint}`, {
    level: "error",
    tags: { "http.status_code": String(status), endpoint },
    fingerprint: ["github-api", verb, endpoint, String(status)],
  });
}
