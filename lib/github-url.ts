import { encodeRepoId } from "./utils";

// After the optional protocol and `www.`, the host must be exactly github.com.
// Keeps out api.github.com, gist.github.com, raw.githubusercontent.com, etc.
const GITHUB_HOST_RE = /^(?:https?:\/\/)?(?:www\.)?github\.com(?=\/|$)/i;

// First path segments that are github.com's own pages, not a user or org.
const RESERVED_FIRST_SEGMENT = new Set([
  "orgs",
  "sponsors",
  "settings",
  "marketplace",
  "topics",
  "collections",
  "notifications",
  "explore",
  "trending",
  "features",
  "about",
  "pricing",
  "login",
  "join",
  "search",
  "new",
  "apps",
  "dashboard",
  "account",
  "codespaces",
]);

/**
 * Maps a github.com web URL to an in-app route string, or returns null when the
 * app has no screen for it (the caller should then open the URL in the browser).
 *
 * Pure. The route string is cast to `Href` by callers; typed-routes can't check
 * an interpolated string, so keep the paths here in sync with the route tree.
 */
export function parseGitHubUrl(url: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !GITHUB_HOST_RE.test(trimmed)) return null;

  const path = trimmed.replace(GITHUB_HOST_RE, "").replace(/[?#].*$/, "");
  const seg = path.split("/").filter(Boolean).map(safeDecode);
  if (seg.length === 0) return null;
  if (RESERVED_FIRST_SEGMENT.has(seg[0].toLowerCase())) return null;

  // /{user}
  if (seg.length === 1) return `/(app)/user/${seg[0]}`;

  const [owner, repo, kind, a] = seg;
  const repoId = encodeRepoId(owner, repo);
  const repoBase = `/(app)/repo/${repoId}`;

  if (!kind) return repoBase;

  switch (kind) {
    case "pull":
      return a ? `${repoBase}/pr/${a}` : `${repoBase}/pull-requests`;
    case "pulls":
      return `${repoBase}/pull-requests`;
    case "issues":
      return a ? `${repoBase}/issue/${a}` : `${repoBase}/issues`;
    case "commit":
      return a ? `${repoBase}/commit/${a}` : null;
    case "commits":
      return `${repoBase}/commits`;
    case "compare": {
      // range is `base...head` (or the two-dot form); refs may contain dots.
      const [base, head] = (a ?? "").split(/\.\.\.?/);
      if (!base || !head) return null;
      return `${repoBase}/compare?base=${encodeURIComponent(
        base,
      )}&head=${encodeURIComponent(head)}`;
    }
    case "releases": {
      if (a === "tag" && seg.length > 4) {
        const tag = seg.slice(4).join("/");
        return `${repoBase}/release/${encodeURIComponent(tag)}`;
      }
      return `${repoBase}/releases`;
    }
    case "tree":
      // ponytail: the files screen has no path arg, so /tree/{ref}/{path} lands
      // on the tree root. Add path drill-down when files.tsx takes a path param.
      return `${repoBase}/files`;
    case "blob": {
      // /blob/{ref}/{...path}. The file viewer fetches from the default branch,
      // so the ref and any #L line range are dropped for now.
      const filePath = seg.slice(4).join("/");
      if (!filePath) return `${repoBase}/files`;
      const fileName = seg[seg.length - 1];
      return `${repoBase}/file?path=${encodeURIComponent(
        filePath,
      )}&fileName=${encodeURIComponent(fileName)}`;
    }
    default:
      return null;
  }
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
