import { useCallback, useEffect, useState } from "react";

import { mmkv } from "@/lib/mmkv";
import { useWatchlistStore } from "@/stores/watchlist.store";

const NUDGE_SHOWN_KEY = "first_bookmark_nudge_shown";

export function useFirstBookmarkNudge() {
  const [visible, setVisible] = useState(false);
  const onFirstBookmark = useWatchlistStore((s) => s.onFirstBookmark);

  useEffect(() => {
    if (mmkv.getString(NUDGE_SHOWN_KEY) === "true") return;

    onFirstBookmark(() => {
      setVisible(true);
      mmkv.set(NUDGE_SHOWN_KEY, "true");
    });
  }, [onFirstBookmark]);

  const dismiss = useCallback(() => setVisible(false), []);

  return { visible, dismiss };
}
