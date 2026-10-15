import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import {
  type NotificationAlert,
  pollNotifications,
  resetNotificationPoller,
} from "@/lib/notification-poller";

export const ALERTS_TASK = "shikai-notification-alerts";
const CHANNEL_ID = "github-notifications";
/** WorkManager's floor. Android treats it as a minimum, so real runs drift later. */
const POLL_INTERVAL_MINUTES = 15;

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
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    if (__DEV__) console.log("[alerts] poll failed", String(error));
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
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

export type EnableAlertsResult = "enabled" | "denied" | "unavailable";

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

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return "denied";

  await BackgroundTask.registerTaskAsync(ALERTS_TASK, {
    minimumInterval: POLL_INTERVAL_MINUTES,
  });
  return "enabled";
}

/** Stops polling and forgets the marker, so turning alerts on again starts fresh. */
export async function disableAlerts(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(ALERTS_TASK)) {
    await BackgroundTask.unregisterTaskAsync(ALERTS_TASK);
  }
  resetNotificationPoller();
}
