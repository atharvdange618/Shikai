import * as Notifications from "expo-notifications";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { markNotificationAsRead } from "@/lib/github-rest";
import { parseGitHubApiUrl } from "@/lib/github-url";
import { useAuthStore } from "@/stores/auth.store";

const NOTIFICATIONS_TAB = "/(app)/(tabs)/notifications";

/**
 * Opens the thread behind a tapped alert. useLastNotificationResponse covers
 * both a tap that launched the app (cold start) and taps while it runs.
 * No-ops until `enabled` so nothing routes onto a gated screen before
 * sign-in; a cold-start tap waits here until boot finishes.
 */
export function useNotificationTaps(enabled: boolean) {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = response.notification.request.identifier;
    if (handledId.current === id) return;
    handledId.current = id;
    // Otherwise the same tap routes again on the next launch.
    Notifications.clearLastNotificationResponseAsync().catch(() => {});

    const data = response.notification.request.content.data;
    const subjectUrl = typeof data?.subjectUrl === "string" ? data.subjectUrl : null;
    const threadId = typeof data?.threadId === "string" ? data.threadId : null;

    // The "N more" summary has no thread, so it opens the tab.
    router.push((parseGitHubApiUrl(subjectUrl) ?? NOTIFICATIONS_TAB) as Href);

    // Same as tapping the row in the notifications tab.
    const pat = useAuthStore.getState().pat;
    if (threadId && threadId !== "dev-test" && pat) {
      markNotificationAsRead(threadId, pat).catch(() => {});
    }
  }, [enabled, response, router]);
}
