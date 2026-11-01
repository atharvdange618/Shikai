import { appLinkPath, isGitHubUrl, isOAuthRedirect } from "@/lib/github-url";

// The OAuth redirect (shikai://?code=...) maps to the blank index route. On a
// warm start, letting the router navigate there buries the sign-in screen, so
// any outcome that doesn't set a token (install prompt, error) shows a blank
// screen forever. sign-in.tsx reads the code through its own Linking listener,
// so the router can drop the link. An empty string tells it not to navigate.
// Cold starts keep the path: AppStack replaces the index with /sign-in anyway.
//
// github.com links (VIEW intents) have no matching route, so the router would
// show +not-found. useDeepLinks maps them through parseGitHubUrl(), so the
// router drops them on both warm and cold starts. Signed out, useDeepLinks
// isn't listening: a cold-start link opens after sign-in, a warm one is dropped.
//
// Cold-start shikai:// links go the same way. Left to the router, they become
// the first screen and AppStack's boot replace to overview throws them away.
// Warm ones pass through, since the router opens those itself.
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  if (isGitHubUrl(path)) return "";
  if (!initial && isOAuthRedirect(path)) return "";
  if (initial && appLinkPath(path)) return "";
  return path;
}
