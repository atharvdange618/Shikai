import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  store: new Map<string, string | boolean>(),
  task: { run: null as null | (() => Promise<number>) },
  getStatusAsync: vi.fn(),
  registerTaskAsync: vi.fn(),
  unregisterTaskAsync: vi.fn(),
  isTaskRegisteredAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  pollNotifications: vi.fn(),
  resetNotificationPoller: vi.fn(),
}));

vi.mock("expo-background-task", () => ({
  BackgroundTaskStatus: { Restricted: 1, Available: 2 },
  BackgroundTaskResult: { Success: 1, Failed: 2 },
  getStatusAsync: m.getStatusAsync,
  registerTaskAsync: m.registerTaskAsync,
  unregisterTaskAsync: m.unregisterTaskAsync,
}));
vi.mock("expo-task-manager", () => ({
  defineTask: (_name: string, run: () => Promise<number>) => {
    m.task.run = run;
  },
  isTaskRegisteredAsync: m.isTaskRegisteredAsync,
}));
vi.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 5 },
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: m.setNotificationChannelAsync,
  getPermissionsAsync: m.getPermissionsAsync,
  requestPermissionsAsync: m.requestPermissionsAsync,
  scheduleNotificationAsync: m.scheduleNotificationAsync,
}));
vi.mock("@/lib/notification-poller", () => ({
  pollNotifications: m.pollNotifications,
  resetNotificationPoller: m.resetNotificationPoller,
}));
vi.mock("@/lib/mmkv", () => ({
  mmkv: {
    getBoolean: (k: string) => m.store.get(k) as boolean | undefined,
    set: (k: string, v: string | boolean) => m.store.set(k, v),
    remove: (k: string) => m.store.delete(k),
  },
}));

import {
  ALERTS_TASK,
  areAlertsEnabled,
  disableAlerts,
  enableAlerts,
  lostAlertsAccess,
  wasPatRejected,
} from "@/lib/background-notifications";
import { useAuthStore } from "@/stores/auth.store";

const granted = { granted: true, canAskAgain: true };
const deniedAskable = { granted: false, canAskAgain: true };
const deniedBlocked = { granted: false, canAskAgain: false };

beforeEach(() => {
  vi.clearAllMocks();
  m.store.clear();
  m.getStatusAsync.mockResolvedValue(2);
  m.isTaskRegisteredAsync.mockResolvedValue(true);
  useAuthStore.setState({ token: null, user: null, pat: null });
});

describe("enableAlerts", () => {
  it("creates the channel before asking, then registers at 15 minutes", async () => {
    m.getPermissionsAsync.mockResolvedValue(deniedAskable);
    m.requestPermissionsAsync.mockResolvedValue(granted);

    await expect(enableAlerts()).resolves.toBe("enabled");
    expect(m.setNotificationChannelAsync.mock.invocationCallOrder[0]).toBeLessThan(
      m.requestPermissionsAsync.mock.invocationCallOrder[0],
    );
    expect(m.registerTaskAsync).toHaveBeenCalledWith(ALERTS_TASK, { minimumInterval: 15 });
  });

  it("skips the prompt when permission is already granted", async () => {
    m.getPermissionsAsync.mockResolvedValue(granted);
    await expect(enableAlerts()).resolves.toBe("enabled");
    expect(m.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("clears the PAT-rejected flag once alerts are back on", async () => {
    m.store.set("notification-alerts.pat-rejected", true);
    m.getPermissionsAsync.mockResolvedValue(granted);
    await enableAlerts();
    expect(wasPatRejected()).toBe(false);
  });

  it("returns denied when the user says no but Android could ask again", async () => {
    m.getPermissionsAsync.mockResolvedValue(deniedAskable);
    m.requestPermissionsAsync.mockResolvedValue(deniedAskable);
    await expect(enableAlerts()).resolves.toBe("denied");
    expect(m.registerTaskAsync).not.toHaveBeenCalled();
  });

  it("returns blocked without prompting when Android won't ask again", async () => {
    m.getPermissionsAsync.mockResolvedValue(deniedBlocked);
    await expect(enableAlerts()).resolves.toBe("blocked");
    expect(m.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(m.registerTaskAsync).not.toHaveBeenCalled();
  });

  it("returns unavailable when background work is restricted", async () => {
    m.getStatusAsync.mockResolvedValue(1);
    await expect(enableAlerts()).resolves.toBe("unavailable");
    expect(m.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("disableAlerts", () => {
  it("unregisters the task and resets the marker", async () => {
    await disableAlerts();
    expect(m.unregisterTaskAsync).toHaveBeenCalledWith(ALERTS_TASK);
    expect(m.resetNotificationPoller).toHaveBeenCalled();
  });

  it("only resets the marker when the task isn't registered", async () => {
    m.isTaskRegisteredAsync.mockResolvedValue(false);
    await disableAlerts();
    expect(m.unregisterTaskAsync).not.toHaveBeenCalled();
    expect(m.resetNotificationPoller).toHaveBeenCalled();
  });
});

describe("areAlertsEnabled", () => {
  it("needs both a registered task and notification permission", async () => {
    m.getPermissionsAsync.mockResolvedValue(granted);
    await expect(areAlertsEnabled()).resolves.toBe(true);
    m.getPermissionsAsync.mockResolvedValue(deniedBlocked);
    await expect(areAlertsEnabled()).resolves.toBe(false);
    m.getPermissionsAsync.mockResolvedValue(granted);
    m.isTaskRegisteredAsync.mockResolvedValue(false);
    await expect(areAlertsEnabled()).resolves.toBe(false);
  });
});

describe("the background task", () => {
  const alert = {
    threadId: "1",
    title: "Fix the build",
    repoFullName: "o/r",
    subjectType: "PullRequest" as const,
    subjectUrl: "https://api.github.com/repos/o/r/pulls/1",
  };

  it("posts each alert plus an overflow summary on the alerts channel", async () => {
    m.pollNotifications.mockResolvedValue({ kind: "checked", alerts: [alert], overflow: 2 });
    await expect(m.task.run!()).resolves.toBe(1);

    expect(m.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(m.scheduleNotificationAsync.mock.calls[0][0]).toEqual({
      content: { title: "Fix the build", body: "o/r", data: alert },
      trigger: { channelId: "github-notifications" },
    });
    expect(m.scheduleNotificationAsync.mock.calls[1][0].content.title).toBe(
      "2 more GitHub notifications",
    );
  });

  it("posts nothing on a quiet poll", async () => {
    m.pollNotifications.mockResolvedValue({ kind: "not-modified" });
    await m.task.run!();
    expect(m.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("turns alerts off and flags it when GitHub rejects the PAT", async () => {
    m.pollNotifications.mockResolvedValue({ kind: "unauthorized" });
    await expect(m.task.run!()).resolves.toBe(1);
    expect(m.unregisterTaskAsync).toHaveBeenCalledWith(ALERTS_TASK);
    expect(wasPatRejected()).toBe(true);
  });

  it("reports a failure when the poll throws", async () => {
    m.pollNotifications.mockRejectedValue(new Error("offline"));
    await expect(m.task.run!()).resolves.toBe(2);
  });
});

describe("losing access", () => {
  it("is true when the token or the PAT goes away", () => {
    expect(lostAlertsAccess({ token: "t", pat: "p" }, { token: null, pat: null })).toBe(true);
    expect(lostAlertsAccess({ token: "t", pat: "p" }, { token: "t", pat: null })).toBe(true);
  });

  it("is false while signing in or when nothing was there", () => {
    expect(lostAlertsAccess({ token: null, pat: null }, { token: "t", pat: "p" })).toBe(false);
    expect(lostAlertsAccess({ token: null, pat: null }, { token: null, pat: null })).toBe(false);
    expect(lostAlertsAccess({ token: "t", pat: "p" }, { token: "t", pat: "p" })).toBe(false);
  });

  it("stops alerts on sign-out through the auth store", async () => {
    useAuthStore.setState({ token: "t", pat: "p" });
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    await vi.waitFor(() => expect(m.unregisterTaskAsync).toHaveBeenCalledWith(ALERTS_TASK));
  });

  it("stops alerts when only the PAT is removed", async () => {
    useAuthStore.setState({ token: "t", pat: "p" });
    vi.clearAllMocks();
    useAuthStore.getState().setPat(null);
    await vi.waitFor(() => expect(m.unregisterTaskAsync).toHaveBeenCalledWith(ALERTS_TASK));
  });
});
