import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import { mmkv } from "@/lib/mmkv";
import {
  type NotificationAlert,
  pollNotifications,
  resetNotificationPoller,
} from "@/lib/notification-poller";
import { useAuthStore } from "@/stores/auth.store";

export const ALERTS_TASK = "shikai-notification-alerts";
const CHANNEL_ID = "github-notifications";
/** WorkManager's floor. Android treats it as a minimum, so real runs drift later. */
const POLL_INTERVAL_MINUTES = 15;
/** Set when the task turned itself off because GitHub rejected the PAT. */
const PAT_REJECTED_KEY = "notification-alerts.pat-rejected";

// Without a handler, expo-notifications drops alerts posted while Shikai is
// open. List them in the shade quietly instead.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Must run at module load, outside React: when WorkManager wakes the app
// headless, only index.ts and its imports run before the task fires.
TaskManager.defineTask(ALERTS_TASK, async () => {
  try {
    const result = await pollNotifications();
    if (__DEV__) {
      console.log(
        "[alerts] poll",
        result.kind,
        result.kind === "checked" ? `${result.alerts.length}+${result.overflow}` : "",
      );
    }
    if (result.kind === "checked") {
      await postAlerts(result.alerts, result.overflow);
    } else if (result.kind === "unauthorized") {
      await disableAlerts();
      mmkv.set(PAT_REJECTED_KEY, true);
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    if (__DEV__) console.log("[alerts] poll failed", String(error));
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * True when signing out or removing the PAT should stop alerts. Every
 * sign-out path (Settings, a 401 mid-session, a failed token check at boot)
 * ends in clearAuth, which nulls the token; removing the PAT nulls `pat`.
 */
export function lostAlertsAccess(
  prev: { token: string | null; pat: string | null },
  next: { token: string | null; pat: string | null },
): boolean {
  return (Boolean(prev.token) && !next.token) || (Boolean(prev.pat) && !next.pat);
}

// The PAT outlives sign-out in SecureStore, and the task reads it from there,
// so a registered task would keep alerting a signed-out phone. Stop it here,
// once, instead of at each sign-out call site.
useAuthStore.subscribe((next, prev) => {
  if (lostAlertsAccess(prev, next)) void disableAlerts();
});

async function postAlerts(
  alerts: NotificationAlert[],
  overflow: number,
): Promise<void> {
  for (const alert of alerts) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.title,
        body: alert.repoFullName,
        // Read by the tap handler to open the thread in the app.
        data: { ...alert },
      },
      trigger: { channelId: CHANNEL_ID },
    });
  }
  if (overflow > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${overflow} more GitHub ${overflow === 1 ? "notification" : "notifications"}`,
        body: "Open Shikai to see them all.",
      },
      trigger: { channelId: CHANNEL_ID },
    });
  }
}

/**
 * "blocked" means Android won't show the prompt again (denied twice, or
 * turned off in system settings); only the app's settings page can fix it.
 */
export type EnableAlertsResult = "enabled" | "denied" | "blocked" | "unavailable";

/**
 * Creates the channel, asks for notification permission, and schedules the
 * poll. The channel has to exist before the request, or Android 13+ never
 * shows the permission prompt.
 */
export async function enableAlerts(): Promise<EnableAlertsResult> {
  if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) {
    return "unavailable";
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "GitHub notifications",
    description: "Review requests, mentions and assignments",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return permission.canAskAgain ? "denied" : "blocked";

  await BackgroundTask.registerTaskAsync(ALERTS_TASK, {
    minimumInterval: POLL_INTERVAL_MINUTES,
  });
  mmkv.remove(PAT_REJECTED_KEY);
  return "enabled";
}

/** Stops polling and forgets the marker, so turning alerts on again starts fresh. */
export async function disableAlerts(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(ALERTS_TASK)) {
    await BackgroundTask.unregisterTaskAsync(ALERTS_TASK);
  }
  resetNotificationPoller();
}

/**
 * On only when the task is registered and Android still lets us post. If the
 * user blocked notifications in system settings, the task would poll for
 * nothing, so the toggle reads off.
 */
export async function areAlertsEnabled(): Promise<boolean> {
  const [registered, permission] = await Promise.all([
    TaskManager.isTaskRegisteredAsync(ALERTS_TASK),
    Notifications.getPermissionsAsync(),
  ]);
  return registered && permission.granted;
}

/** True if the task turned alerts off because GitHub rejected the PAT. */
export function wasPatRejected(): boolean {
  return mmkv.getBoolean(PAT_REJECTED_KEY) ?? false;
}
