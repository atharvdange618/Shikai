import { encodeRepoId } from "./utils";

const GITHUB_HOST_RE = /^(?:https?:\/\/)?(?:www\.)?github\.com(?=\/|$)/i;

export const isGitHubUrl = (url: string): boolean => GITHUB_HOST_RE.test(url.trim());

export const isOAuthRedirect = (url: string): boolean =>
  url.startsWith("shikai:") && /[?&]code=/.test(url);

export const isDevClientUrl = (url: string): boolean =>
  url.startsWith("shikai:") &&
  (url.startsWith("shikai://expo-development-client") || /[?&]__expo_url=/.test(url.split("#")[0]));

export function appLinkPath(url: string): string | null {
  const rest = /^shikai:\/\/\/?(.+)$/.exec(url)?.[1];
  if (!rest || isOAuthRedirect(url) || isDevClientUrl(url)) return null;
  return `/${rest}`;
}

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

const PR_TABS = new Set(["files", "commits", "checks"]);

export function parseGitHubUrl(url: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !GITHUB_HOST_RE.test(trimmed)) return null;

  const withoutHost = trimmed.replace(GITHUB_HOST_RE, "");
  const hashIndex = withoutHost.indexOf("#");
  const fragment = hashIndex === -1 ? "" : withoutHost.slice(hashIndex + 1);
  const path = (hashIndex === -1 ? withoutHost : withoutHost.slice(0, hashIndex)).replace(
    /\?.*$/,
    "",
  );
  const seg = path.split("/").filter(Boolean).map(safeDecode);
  if (seg.length === 0) return null;
  if (RESERVED_FIRST_SEGMENT.has(seg[0].toLowerCase())) return null;

  if (seg.length === 1) return `/(app)/user/${seg[0]}`;

  const [owner, repo, kind, a] = seg;
  const repoId = encodeRepoId(owner, repo);
  const repoBase = `/(app)/repo/${repoId}`;

  if (!kind) return repoBase;

  switch (kind) {
    case "pull": {
      if (!a) return `${repoBase}/pull-requests`;
      const tab = seg[4];
      return tab && PR_TABS.has(tab) ? `${repoBase}/pr/${a}/${tab}` : `${repoBase}/pr/${a}`;
    }
    case "pulls":
      return `${repoBase}/pull-requests`;
    case "issues":
      return a ? `${repoBase}/issue/${a}` : `${repoBase}/issues`;
    case "commit":
      return a ? `${repoBase}/commit/${a}` : null;
    case "commits":
      return `${repoBase}/commits`;
    case "compare": {
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
    case "actions": {
      const runId = a === "runs" ? seg[4] : undefined;
      if (!runId || !/^\d+$/.test(runId)) return `${repoBase}/actions`;
      const attempt = seg[5] === "attempts" ? seg[6] : undefined;
      const query = attempt && /^[1-9]\d*$/.test(attempt) ? `?attempt=${attempt}` : "";
      return `${repoBase}/run/${runId}${query}`;
    }
    case "pulse":
    case "graphs":
      return `${repoBase}/insights`;
    case "tree":
    case "blob": {
      if (!a) return `${repoBase}/files`;
      const linkedKind = kind === "blob" && seg.length > 4 ? "blob" : "tree";
      const segments = JSON.stringify(seg.slice(3)).replaceAll("%", "\\u0025");
      const lineMatch = linkedKind === "blob" && fragment.match(/^L(\d+)/i);
      const lineParam = lineMatch ? `&line=${lineMatch[1]}` : "";
      return `${repoBase}/linked-path?kind=${linkedKind}&segments=${encodeURIComponent(segments)}${lineParam}`;
    }
    default:
      return null;
  }
}

const API_REPO_RE = /^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)(?:\/(.*))?$/;

/**
 * Maps the API URL GitHub puts on a notification's subject
 * (`https://api.github.com/repos/{owner}/{repo}/pulls/12`) to an in-app
 * route, or null when the app has no screen for it. Shared by the
 * notifications tab and the alert tap handler.
 */
export function parseGitHubApiUrl(url: string | null | undefined): string | null {
  const match = url?.match(API_REPO_RE);
  if (!match) return null;

  const [, owner, repo, rest] = match;
  const repoBase = `/(app)/repo/${encodeRepoId(owner, repo)}`;
  if (!rest) return repoBase;

  const [kind, id] = rest.split("/");
  switch (kind) {
    case "pulls":
      return id ? `${repoBase}/pr/${id}` : null;
    case "issues":
      return id ? `${repoBase}/issue/${id}` : null;
    case "commits":
      return id ? `${repoBase}/commit/${id}` : null;
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
