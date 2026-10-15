import { GitHubApiError } from "@/lib/axios";
import { fetchParticipatingNotifications } from "@/lib/github-rest";
import { mmkv } from "@/lib/mmkv";
import { getStoredPAT } from "@/lib/secure-storage";
import type { GitHubNotification } from "@/types/github.types";

/** Alerts posted per poll; anything past this becomes an "and N more" count. */
export const MAX_ALERTS = 3;

// clearAllMMKV wipes these on sign-in and sign-out, so a new account starts
// from a fresh marker.
const MARKER_KEY = "notification-alerts.marker";
const ETAG_KEY = "notification-alerts.etag";
const EPOCH = new Date(0).toISOString();

export interface NotificationAlert {
  threadId: string;
  title: string;
  repoFullName: string;
  subjectType: GitHubNotification["subject"]["type"];
  /** API URL of the issue/PR/etc.; null for some types (e.g. CheckRun). */
  subjectUrl: string | null;
}

export type PollResult =
  | { kind: "no-pat" }
  | { kind: "unauthorized" }
  | { kind: "not-modified" }
  /** First run: marker recorded, nothing posted, so the backlog stays quiet. */
  | { kind: "seeded" }
  /** `alerts` is empty when the list changed but nothing is newer than the marker. */
  | { kind: "checked"; alerts: NotificationAlert[]; overflow: number };

/**
 * Picks unread threads updated after `marker`, newest first, capped at
 * MAX_ALERTS. `nextMarker` is the newest `updated_at` seen, never older than
 * the current marker.
 */
export function planAlerts(
  notifications: GitHubNotification[],
  marker: string,
): { alerts: NotificationAlert[]; overflow: number; nextMarker: string } {
  const markerTime = Date.parse(marker);
  const fresh = notifications
    .filter((n) => n.unread && Date.parse(n.updated_at) > markerTime)
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

  const nextMarker = notifications.reduce(
    (latest, n) =>
      Date.parse(n.updated_at) > Date.parse(latest) ? n.updated_at : latest,
    marker,
  );

  return {
    alerts: fresh.slice(0, MAX_ALERTS).map(toAlert),
    overflow: Math.max(0, fresh.length - MAX_ALERTS),
    nextMarker,
  };
}

function toAlert(n: GitHubNotification): NotificationAlert {
  return {
    threadId: n.id,
    title: n.subject.title,
    repoFullName: n.repository.full_name,
    subjectType: n.subject.type,
    subjectUrl: n.subject.url,
  };
}

/**
 * One background poll. Reads the PAT and the stored marker, asks GitHub for
 * participating threads, and returns what to alert on. Posting the alerts is
 * the caller's job, which keeps expo-notifications out of this module.
 * Errors other than 401 are thrown so the task can report a failure.
 */
export async function pollNotifications(): Promise<PollResult> {
  const pat = await getStoredPAT();
  if (!pat) return { kind: "no-pat" };

  const marker = mmkv.getString(MARKER_KEY) ?? null;
  // Without a marker, a stale ETag could get a 304 and hide the threads we
  // need to seed from, so skip the conditional request.
  const etag = marker ? (mmkv.getString(ETAG_KEY) ?? null) : null;

  let result;
  try {
    result = await fetchParticipatingNotifications(pat, etag);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 401) {
      return { kind: "unauthorized" };
    }
    throw error;
  }

  if (!result.modified) return { kind: "not-modified" };
  if (result.etag) mmkv.set(ETAG_KEY, result.etag);

  if (!marker) {
    // Seed from GitHub's own clock so a phone running fast can't skip
    // threads. ponytail: falls back to the phone clock when the list is
    // empty; a skewed clock could miss threads updated in that gap.
    const { nextMarker } = planAlerts(result.notifications, EPOCH);
    mmkv.set(MARKER_KEY, nextMarker === EPOCH ? new Date().toISOString() : nextMarker);
    return { kind: "seeded" };
  }

  const { alerts, overflow, nextMarker } = planAlerts(result.notifications, marker);
  mmkv.set(MARKER_KEY, nextMarker);
  return { kind: "checked", alerts, overflow };
}

/** Forget the marker so turning alerts back on starts fresh, not with a backlog. */
export function resetNotificationPoller(): void {
  mmkv.remove(MARKER_KEY);
  mmkv.remove(ETAG_KEY);
}
