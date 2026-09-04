import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect, useRef } from "react";

import { parseGitHubUrl } from "@/lib/github-url";

/**
 * Sends github.com URLs to the right in-app screen, from two sources:
 *   1. Links opened into the app (custom scheme, or the github.com VIEW filter
 *      when the user has opted Shikai in).
 *   2. Links shared into the app from Gmail, a browser, etc. via the Android
 *      share sheet (expo-share-intent). This is the reliable path, since a
 *      plain tap on a github.com link goes to the GitHub app's verified links.
 *
 * Unmatched github.com URLs fall back to the browser. No-ops until `enabled`
 * so nothing routes onto a gated screen before sign-in.
 */
export function useDeepLinks(enabled: boolean) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  const initialHandled = useRef(false);

  function route(url: string) {
    if (!/github\.com/i.test(url)) return;
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
      Linking.getInitialURL().then(handle);
    }
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub.remove();
  }, [enabled]);

  useEffect(() => {
    if (!hasShareIntent) return;

    if (enabled) {
      const shared =
        shareIntent.webUrl ??
        shareIntent.text?.match(/https?:\/\/\S+/)?.[0] ??
        shareIntent.text;
      if (shared) routeRef.current(shared);
    }
    resetShareIntent();
  }, [enabled, hasShareIntent, shareIntent, resetShareIntent]);
}
