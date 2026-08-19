import { useCallback, useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";

import { useOnlineManager } from "@/lib/use-online-manager";

function logUpdateEvent(type: "check" | "available" | "downloading" | "ready" | "error", message?: string) {
  if (__DEV__) {
    console.log(`[OTA] ${type}`, message ?? "");
  }
}

export function useOTAUpdates(): {
  updateReady: boolean;
  reload: () => Promise<void>;
} {
  const isOnline = useOnlineManager();
  const hasChecked = useRef(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!isOnline || hasChecked.current) return;

    hasChecked.current = true;

    async function run() {
      try {
        logUpdateEvent("check", "checking for updates…");
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          logUpdateEvent("available", update.manifest?.id ?? "unknown");
          logUpdateEvent("downloading");
          await Updates.fetchUpdateAsync();
          logUpdateEvent("ready", "waiting for user to restart");
          setUpdateReady(true);
        } else {
          logUpdateEvent("check", "no update available");
        }
      } catch (error) {
        logUpdateEvent("error", String(error));
      }
    }

    run();
  }, [isOnline]);

  const reload = useCallback(() => Updates.reloadAsync(), []);

  return { updateReady, reload };
}
