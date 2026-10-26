import * as StoreReview from "expo-store-review";
import { useEffect } from "react";
import { createMMKV } from "react-native-mmkv";

import { recordLaunch } from "@/lib/review-prompt";

// Its own instance so clearAllMMKV() on sign-in and sign-out doesn't reset
// the count. It holds no account data.
const reviewMMKV = createMMKV({ id: "shikai-review" });

// Gives the first screen time to load before the sheet covers it.
const ASK_DELAY_MS = 3000;

let launchRecorded = false;

/** Counts signed-in launches and asks for a Play review on the fifth. */
export function useReviewPrompt(enabled: boolean) {
  useEffect(() => {
    if (!enabled || launchRecorded) return;
    launchRecorded = true;
    if (!recordLaunch(reviewMMKV)) return;

    const timer = setTimeout(async () => {
      try {
        if (await StoreReview.isAvailableAsync()) {
          await StoreReview.requestReview();
        }
      } catch (e) {
        console.error("Review prompt failed", e);
      }
    }, ASK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled]);
}
