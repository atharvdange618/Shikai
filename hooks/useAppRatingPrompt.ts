import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";

import { mmkv } from "@/lib/mmkv";

const PLAY_STORE_URL =
  "https://play.store/details?id=in.atharvdange.shikai";

const MIN_LAUNCHES = 5;
const COOLDOWN_DAYS = 3;
const LAUNCH_COUNT_KEY = "rating_launch_count";
const LAST_SHOWN_KEY = "rating_last_shown";
const DISMISSED_KEY = "rating_dismissed";

function getDaysSince(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

export function useAppRatingPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = mmkv.getString(DISMISSED_KEY);
    if (dismissed === "true") return;

    const launchCount = mmkv.getNumber(LAUNCH_COUNT_KEY) ?? 0;
    mmkv.set(LAUNCH_COUNT_KEY, launchCount + 1);

    if (launchCount + 1 < MIN_LAUNCHES) return;

    const lastShown = mmkv.getNumber(LAST_SHOWN_KEY);
    if (lastShown && getDaysSince(lastShown) < COOLDOWN_DAYS) return;

    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const rate = useCallback(() => {
    Linking.openURL(PLAY_STORE_URL);
    mmkv.set(LAST_SHOWN_KEY, Date.now());
    setVisible(false);
  }, []);

  const dismiss = useCallback(() => {
    mmkv.set(LAST_SHOWN_KEY, Date.now());
    setVisible(false);
  }, []);

  const dismissForever = useCallback(() => {
    mmkv.set(DISMISSED_KEY, "true");
    setVisible(false);
  }, []);

  return { visible, rate, dismiss, dismissForever };
}
