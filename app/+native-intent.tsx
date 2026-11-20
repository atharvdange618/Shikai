import { appLinkPath, isDevClientUrl, isGitHubUrl, isOAuthRedirect } from "@/lib/github-url";

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  if (isGitHubUrl(path)) return "";
  if (isDevClientUrl(path)) return "";
  if (!initial && isOAuthRedirect(path)) return "";
  if (initial && appLinkPath(path)) return "";
  return path;
}
