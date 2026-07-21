import { useEffect } from "react";
import { Platform } from "react-native";
import * as ExpoInAppUpdates from "expo-in-app-updates";

export function useInAppUpdates() {
  useEffect(() => {
    if (__DEV__ || Platform.OS !== "android") return;

    const check = async () => {
      try {
        const result = await ExpoInAppUpdates.checkForUpdate();
        if (result.updateAvailable) {
          await ExpoInAppUpdates.startUpdate();
        }
      } catch {
        // silent fail - don't block app usage
      }
    };

    check();
  }, []);
}
