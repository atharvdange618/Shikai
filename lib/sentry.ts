/**
 * lib/sentry.ts
 *
 * Sentry setup for crash and performance reporting.
 *
 * Choices:
 *   - Off in dev (`enabled: !__DEV__`) so local noise stays out of the project.
 *     Test with a preview or release build, where __DEV__ is false.
 *   - No PII: `sendDefaultPii: false`, no `Sentry.setUser`. Reports carry the
 *     device model, OS, app version, and OTA update id, nothing that names a
 *     person.
 *   - `beforeSend` strips the GitHub token before anything leaves the device.
 *     The app auths every GitHub call with a Bearer token or a PAT, and a
 *     crash payload could otherwise carry it in a header, an error message,
 *     or a breadcrumb.
 *
 * The DSN is read from EXPO_PUBLIC_SENTRY_DSN so it stays out of the public
 * repo. Without it, init is a no-op.
 */

import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// gh[pousr]_ covers PATs (ghp_), OAuth (gho_), and the other GitHub token
// prefixes; github_pat_ covers fine-grained PATs.
const TOKEN_RE =
  /\b(gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,})\b/g;

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
        const val = crumb.data[key];
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
      values: [
        { value: "failed with github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345" },
      ],
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
