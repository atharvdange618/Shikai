import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect, useRef } from "react";

import { appLinkPath, isGitHubUrl, parseGitHubUrl } from "@/lib/github-url";
import { mmkv } from "@/lib/mmkv";

/**
 * Android gives back the intent that created the app's task on every JS start,
 * not the intent that started this run. `launchMode="singleTask"` keeps that
 * original intent on the activity, so `getInitialURL()` still returns the link
 * after a reload. Opening it every time would reopen the same screen, so
 * remember the last link we pushed. See D-033.
 *
 * This only has to cover a JS reload: a task Android restores from a kill goes
 * through `savedInstanceState`, and `plugins/withLaunchIntent` clears the
 * intent before expo-linking reads it, so that path never reaches here.
 *
 * `clearAllMMKV` wipes this on sign-in and sign-out. That is the right
 * lifetime: a link that opened while signed out is still waiting to be handled
 * after sign-in.
 */
const LAST_INITIAL_LINK_KEY = "deep-links.last-initial-link";

/**
 * Sends github.com URLs to the right in-app screen, from two sources:
 *   1. Links opened into the app (custom scheme, or the github.com VIEW filter
 *      when the user has opted Shikai in).
 *   2. Links shared into the app from Gmail, a browser, etc. via the Android
 *      share sheet (expo-share-intent). This is the reliable path, since a
 *      plain tap on a github.com link goes to the GitHub app's verified links.
 *
 * Also opens the shikai:// link that cold-started the app, which
 * +native-intent keeps from the router so the boot replace can't drop it. That
 * link is opened once: Android keeps handing back the task's original intent,
 * so without the guard it reopened on every reload.
 *
 * Unmatched github.com URLs fall back to the browser. No-ops until `enabled`
 * so nothing routes onto a gated screen before sign-in.
 */
export function useDeepLinks(enabled: boolean) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  const initialHandled = useRef(false);

  function route(url: string) {
    if (!isGitHubUrl(url)) return;
    const target = parseGitHubUrl(url);
    if (target) routerRef.current.push(target as Href);
    else Linking.openURL(url).catch(() => {});
  }

  const routeRef = useRef(route);
  routeRef.current = route;

  useEffect(() => {
    if (!enabled) return;

    const handle = (url: string | null) => {
      if (url) routeRef.current(url);
    };

    if (!initialHandled.current) {
      initialHandled.current = true;
      Linking.getInitialURL().then((url) => {
        const path = url ? appLinkPath(url) : null;
        if (!path) {
          // No launch link, the OAuth redirect or a dev client link: the task
          // wasn't opened by an app link, so forget the last one and let the
          // same link open again next time.
          mmkv.remove(LAST_INITIAL_LINK_KEY);
          handle(url);
          return;
        }
        if (mmkv.getString(LAST_INITIAL_LINK_KEY) === path) return;
        mmkv.set(LAST_INITIAL_LINK_KEY, path);
        routerRef.current.push(path as Href);
      });
    }
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub.remove();
  }, [enabled]);

  // A share that lands during boot or while signed out waits here, and routes
  // once `enabled` turns true. Resetting it early would lose it.
  useEffect(() => {
    if (!enabled || !hasShareIntent) return;

    const shared =
      shareIntent.webUrl ?? shareIntent.text?.match(/https?:\/\/\S+/)?.[0] ?? shareIntent.text;
    if (shared) routeRef.current(shared);
    resetShareIntent();
  }, [enabled, hasShareIntent, shareIntent, resetShareIntent]);
}
