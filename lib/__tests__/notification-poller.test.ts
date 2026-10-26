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
  getLastPoll,
  MAX_ALERTS,
  planAlerts,
  pollNotifications,
  recordPoll,
  resetNotificationPoller,
} from "@/lib/notification-poller";
import type { GitHubNotification } from "@/types/github.types";

const MARKER_KEY = "notification-alerts.marker";
const ETAG_KEY = "notification-alerts.etag";

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

  // Gaps taken from real threads: preloaded email images read in 1 to 5s,
  // the user's own activity leaves last_read_at behind updated_at.
  describe("threads GitHub already marked read", () => {
    function readThread(id: string, updatedAt: string, lastReadAt: string) {
      return { ...thread(id, updatedAt, false), last_read_at: lastReadAt };
    }

    it("alerts when an email preload read it seconds after the update", () => {
      const { alerts } = planAlerts(
        [readThread("preload", "2026-10-15T10:05:00Z", "2026-10-15T10:05:03Z")],
        MARKER,
      );
      expect(alerts.map((a) => a.threadId)).toEqual(["preload"]);
    });

    it("skips threads the user's own activity updated", () => {
      const { alerts } = planAlerts(
        [readThread("mine", "2026-10-15T10:05:00Z", "2026-10-15T09:30:00Z")],
        MARKER,
      );
      expect(alerts).toEqual([]);
    });

    it("skips threads the user read by hand minutes later", () => {
      const { alerts } = planAlerts(
        [readThread("by-hand", "2026-10-15T10:05:00Z", "2026-10-15T10:20:00Z")],
        MARKER,
      );
      expect(alerts).toEqual([]);
    });
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
      store.set(ETAG_KEY, "stale");
      fetchParticipatingNotifications.mockResolvedValue({
        modified: true,
        notifications: [
          thread("1", "2026-10-15T10:05:00Z"),
          thread("2", "2026-10-15T10:10:00Z"),
        ],
        etag: "\"etag-2\"",
      });

      await expect(pollNotifications()).resolves.toEqual({ kind: "seeded" });
      expect(store.get(MARKER_KEY)).toBe("2026-10-15T10:10:00Z");
      expect(store.get(ETAG_KEY)).toBe("\"etag-2\"");
      // No marker yet, so the stale ETag is not sent.
      expect(fetchParticipatingNotifications).toHaveBeenCalledWith("ghp_abc", null);
    });

    it("seeds from the phone clock when there are no threads", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
      fetchParticipatingNotifications.mockResolvedValue({
        modified: true,
        notifications: [],
        etag: null,
      });

      await expect(pollNotifications()).resolves.toEqual({ kind: "seeded" });
      expect(store.get(MARKER_KEY)).toBe("2026-10-15T12:00:00.000Z");
    });
  });

  it("sends the stored ETag and stops on 304", async () => {
    store.set(MARKER_KEY, MARKER);
    store.set(ETAG_KEY, "\"etag-1\"");
    fetchParticipatingNotifications.mockResolvedValue({ modified: false });

    await expect(pollNotifications()).resolves.toEqual({ kind: "not-modified" });
    expect(fetchParticipatingNotifications).toHaveBeenCalledWith(
      "ghp_abc",
      "\"etag-1\"",
    );
    expect(store.get(MARKER_KEY)).toBe(MARKER);
  });

  it("returns capped alerts and saves the new marker and ETag", async () => {
    store.set(MARKER_KEY, MARKER);
    fetchParticipatingNotifications.mockResolvedValue({
      modified: true,
      notifications: ["1", "2", "3", "4"].map((id) =>
        thread(id, `2026-10-15T10:0${id}:00Z`),
      ),
      etag: "\"etag-4\"",
    });

    const result = await pollNotifications();
    expect(result.kind).toBe("checked");
    if (result.kind !== "checked") return;
    expect(result.alerts.map((a) => a.threadId)).toEqual(["4", "3", "2"]);
    expect(result.overflow).toBe(1);
    expect(store.get(MARKER_KEY)).toBe("2026-10-15T10:04:00Z");
    expect(store.get(ETAG_KEY)).toBe("\"etag-4\"");
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
    store.set(ETAG_KEY, "\"etag-1\"");
    resetNotificationPoller();
    fetchParticipatingNotifications.mockResolvedValue({
      modified: true,
      notifications: [thread("1", "2026-10-15T10:05:00Z")],
      etag: null,
    });

    await expect(pollNotifications()).resolves.toEqual({ kind: "seeded" });
    expect(fetchParticipatingNotifications).toHaveBeenCalledWith("ghp_abc", null);
  });
});

describe("last poll", () => {
  beforeEach(() => store.clear());

  afterEach(() => vi.useRealTimers());

  it("is null before the first poll", () => {
    expect(getLastPoll()).toBeNull();
  });

  it("returns the outcome and time of the latest poll", () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T16:00:00Z") });
    recordPoll("not-modified");
    vi.setSystemTime(new Date("2026-10-20T16:30:00Z"));
    recordPoll("failed");
    expect(getLastPoll()).toEqual({ at: "2026-10-20T16:30:00.000Z", outcome: "failed" });
  });

  it("is cleared by a reset", () => {
    recordPoll("checked");
    resetNotificationPoller();
    expect(getLastPoll()).toBeNull();
  });
});
