import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { store, getStoredPAT, fetchParticipatingNotifications, GitHubApiError } =
  vi.hoisted(() => ({
    store: new Map<string, string>(),
    getStoredPAT: vi.fn(),
    fetchParticipatingNotifications: vi.fn(),
    GitHubApiError: class GitHubApiError extends Error {
      constructor(
        public status: number,
        message: string,
      ) {
        super(message);
      }
    },
  }));

vi.mock("@/lib/axios", () => ({ GitHubApiError }));
vi.mock("@/lib/secure-storage", () => ({ getStoredPAT }));
vi.mock("@/lib/github-rest", () => ({ fetchParticipatingNotifications }));
vi.mock("@/lib/mmkv", () => ({
  mmkv: {
    getString: (k: string) => store.get(k),
    set: (k: string, v: string) => store.set(k, v),
    remove: (k: string) => store.delete(k),
  },
}));

import {
  MAX_ALERTS,
  planAlerts,
  pollNotifications,
  resetNotificationPoller,
} from "@/lib/notification-poller";
import type { GitHubNotification } from "@/types/github.types";

const MARKER_KEY = "notification-alerts.marker";
const LAST_MODIFIED_KEY = "notification-alerts.last-modified";

function thread(
  id: string,
  updatedAt: string,
  unread = true,
): GitHubNotification {
  return {
    id,
    unread,
    reason: "review_requested",
    updated_at: updatedAt,
    last_read_at: null,
    subject: {
      title: `Thread ${id}`,
      url: `https://api.github.com/repos/o/r/pulls/${id}`,
      latest_comment_url: null,
      type: "PullRequest",
    },
    repository: { full_name: "o/r" },
  } as GitHubNotification;
}

const MARKER = "2026-10-15T10:00:00Z";

describe("planAlerts", () => {
  it("alerts on unread threads newer than the marker, newest first", () => {
    const { alerts, overflow } = planAlerts(
      [
        thread("1", "2026-10-15T10:05:00Z"),
        thread("2", "2026-10-15T10:10:00Z"),
        thread("old", "2026-10-15T09:00:00Z"),
        thread("same", MARKER),
        thread("read", "2026-10-15T10:20:00Z", false),
      ],
      MARKER,
    );
    expect(alerts.map((a) => a.threadId)).toEqual(["2", "1"]);
    expect(alerts[0]).toEqual({
      threadId: "2",
      title: "Thread 2",
      repoFullName: "o/r",
      subjectType: "PullRequest",
      subjectUrl: "https://api.github.com/repos/o/r/pulls/2",
    });
    expect(overflow).toBe(0);
  });

  it(`caps at ${MAX_ALERTS} alerts and counts the rest as overflow`, () => {
    const threads = ["1", "2", "3", "4", "5"].map((id) =>
      thread(id, `2026-10-15T10:0${id}:00Z`),
    );
    const { alerts, overflow } = planAlerts(threads, MARKER);
    expect(alerts.map((a) => a.threadId)).toEqual(["5", "4", "3"]);
    expect(overflow).toBe(2);
  });

  it("moves the marker to the newest thread seen, read or not", () => {
    const { nextMarker } = planAlerts(
      [thread("1", "2026-10-15T10:05:00Z"), thread("2", "2026-10-15T11:00:00Z", false)],
      MARKER,
    );
    expect(nextMarker).toBe("2026-10-15T11:00:00Z");
  });

  it("never moves the marker backwards", () => {
    const { nextMarker } = planAlerts([thread("old", "2026-10-15T09:00:00Z")], MARKER);
    expect(nextMarker).toBe(MARKER);
  });
});

describe("pollNotifications", () => {
  beforeEach(() => {
    store.clear();
    getStoredPAT.mockReset().mockResolvedValue("ghp_abc");
    fetchParticipatingNotifications.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("does nothing without a PAT", async () => {
    getStoredPAT.mockResolvedValue(null);
    await expect(pollNotifications()).resolves.toEqual({ kind: "no-pat" });
    expect(fetchParticipatingNotifications).not.toHaveBeenCalled();
  });

  describe("first run", () => {
    it("seeds the marker from the newest thread and posts nothing", async () => {
      store.set(LAST_MODIFIED_KEY, "stale");
      fetchParticipatingNotifications.mockResolvedValue({
        modified: true,
        notifications: [
          thread("1", "2026-10-15T10:05:00Z"),
          thread("2", "2026-10-15T10:10:00Z"),
        ],
        lastModified: "Wed, 15 Oct 2026 10:10:00 GMT",
      });

      await expect(pollNotifications()).resolves.toEqual({ kind: "seeded" });
      expect(store.get(MARKER_KEY)).toBe("2026-10-15T10:10:00Z");
      expect(store.get(LAST_MODIFIED_KEY)).toBe("Wed, 15 Oct 2026 10:10:00 GMT");
      // No marker yet, so the stale Last-Modified is not sent.
      expect(fetchParticipatingNotifications).toHaveBeenCalledWith("ghp_abc", null);
    });

    it("seeds from the phone clock when there are no threads", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
      fetchParticipatingNotifications.mockResolvedValue({
        modified: true,
        notifications: [],
        lastModified: null,
      });

      await expect(pollNotifications()).resolves.toEqual({ kind: "seeded" });
      expect(store.get(MARKER_KEY)).toBe("2026-10-15T12:00:00.000Z");
    });
  });

  it("sends the stored Last-Modified and stops on 304", async () => {
    store.set(MARKER_KEY, MARKER);
    store.set(LAST_MODIFIED_KEY, "Wed, 15 Oct 2026 10:00:00 GMT");
    fetchParticipatingNotifications.mockResolvedValue({ modified: false });

    await expect(pollNotifications()).resolves.toEqual({ kind: "not-modified" });
    expect(fetchParticipatingNotifications).toHaveBeenCalledWith(
      "ghp_abc",
      "Wed, 15 Oct 2026 10:00:00 GMT",
    );
    expect(store.get(MARKER_KEY)).toBe(MARKER);
  });

  it("returns capped alerts and saves the new marker and Last-Modified", async () => {
    store.set(MARKER_KEY, MARKER);
    fetchParticipatingNotifications.mockResolvedValue({
      modified: true,
      notifications: ["1", "2", "3", "4"].map((id) =>
        thread(id, `2026-10-15T10:0${id}:00Z`),
      ),
      lastModified: "Wed, 15 Oct 2026 10:04:00 GMT",
    });

    const result = await pollNotifications();
    expect(result.kind).toBe("checked");
    if (result.kind !== "checked") return;
    expect(result.alerts.map((a) => a.threadId)).toEqual(["4", "3", "2"]);
    expect(result.overflow).toBe(1);
    expect(store.get(MARKER_KEY)).toBe("2026-10-15T10:04:00Z");
    expect(store.get(LAST_MODIFIED_KEY)).toBe("Wed, 15 Oct 2026 10:04:00 GMT");
  });

  it("reports a 401 without touching the marker", async () => {
    store.set(MARKER_KEY, MARKER);
    fetchParticipatingNotifications.mockRejectedValue(new GitHubApiError(401, "Bad credentials"));

    await expect(pollNotifications()).resolves.toEqual({ kind: "unauthorized" });
    expect(store.get(MARKER_KEY)).toBe(MARKER);
  });

  it("rethrows other errors so the task can report a failure", async () => {
    store.set(MARKER_KEY, MARKER);
    fetchParticipatingNotifications.mockRejectedValue(new GitHubApiError(500, "boom"));
    await expect(pollNotifications()).rejects.toThrow("boom");
  });

  it("starts over after a reset", async () => {
    store.set(MARKER_KEY, MARKER);
    store.set(LAST_MODIFIED_KEY, "Wed, 15 Oct 2026 10:00:00 GMT");
    resetNotificationPoller();
    fetchParticipatingNotifications.mockResolvedValue({
      modified: true,
      notifications: [thread("1", "2026-10-15T10:05:00Z")],
      lastModified: null,
    });

    await expect(pollNotifications()).resolves.toEqual({ kind: "seeded" });
    expect(fetchParticipatingNotifications).toHaveBeenCalledWith("ghp_abc", null);
  });
});
