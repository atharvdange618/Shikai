import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useCallback, useEffect, useRef } from "react";

import { appLinkPath, isGitHubUrl, parseGitHubUrl } from "@/lib/github-url";
import { mmkv } from "@/lib/mmkv";

const LAST_INITIAL_LINK_KEY = "deep-links.last-initial-link";

export function useDeepLinks(enabled: boolean) {
  const router = useRouter();
  const routerRef = useRef(router);

  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  const initialHandled = useRef(false);

  const route = useCallback((url: string) => {
    if (!isGitHubUrl(url)) return;
    const target = parseGitHubUrl(url);
    if (target) routerRef.current.push(target as Href);
    else Linking.openURL(url).catch(() => {});
  }, []);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!enabled) return;

    const handle = (url: string | null) => {
      if (url) route(url);
    };

    if (!initialHandled.current) {
      initialHandled.current = true;
      Linking.getInitialURL()
        .then((url) => {
          const path = url ? appLinkPath(url) : null;
          if (!path) {
            mmkv.remove(LAST_INITIAL_LINK_KEY);
            handle(url);
            return;
          }
          if (mmkv.getString(LAST_INITIAL_LINK_KEY) === path) return;
          mmkv.set(LAST_INITIAL_LINK_KEY, path);
          routerRef.current.push(path as Href);
        })
        .catch(() => console.error("Could not handle the initial link"));
    }
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub.remove();
  }, [enabled, route]);

  useEffect(() => {
    if (!enabled || !hasShareIntent) return;

    const shared =
      shareIntent.webUrl ?? shareIntent.text?.match(/https?:\/\/\S+/)?.[0] ?? shareIntent.text;
    if (shared) route(shared);
    resetShareIntent();
  }, [enabled, hasShareIntent, shareIntent, resetShareIntent, route]);
}
