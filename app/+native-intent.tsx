// The OAuth redirect (shikai://?code=...) maps to the blank index route. On a
// warm start, letting the router navigate there buries the sign-in screen, so
// any outcome that doesn't set a token (install prompt, error) shows a blank
// screen forever. sign-in.tsx reads the code through its own Linking listener,
// so the router can drop the link. An empty string tells it not to navigate.
// Cold starts keep the path: AppStack replaces the index with /sign-in anyway.
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  if (!initial && isOAuthRedirect(path)) return "";
  return path;
}

function isOAuthRedirect(path: string): boolean {
  return path.startsWith("shikai:") && /[?&]code=/.test(path);
}
