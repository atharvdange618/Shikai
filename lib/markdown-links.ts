const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const ALLOWED_SCHEME_RE = /^(https?|mailto):/i;

/**
 * Turns an href from GitHub-rendered markdown into an absolute URL, or null
 * when it can't or shouldn't be opened. GitHub's /markdown endpoint leaves
 * relative links as written, so `docs/GUIDE.md` in a README has to be
 * resolved against the file's folder in the repo, the way github.com does.
 *
 * `#fragment` links are handled inside the WebView and never reach here.
 * Pure; hand-rolled because React Native's URL polyfill can't resolve
 * relative paths.
 */
export function resolveMarkdownLink(
  href: string,
  context?: string,
  filePath?: string,
): string | null {
  if (href.startsWith("//")) return `https:${href}`;
  if (SCHEME_RE.test(href)) return ALLOWED_SCHEME_RE.test(href) ? href : null;

  const [owner, repo] = context?.split("/") ?? [];
  if (!owner || !repo) return null;

  const suffixIndex = href.search(/[?#]/);
  const path = suffixIndex === -1 ? href : href.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex);

  // Root-relative links start at the repo root; the rest start at the folder
  // holding the current file.
  const segments = path.startsWith("/")
    ? []
    : (filePath ?? "").split("/").slice(0, -1);
  for (const part of path.split("/")) {
    if (part === "..") segments.pop();
    else if (part !== "." && part !== "") segments.push(part);
  }

  const kind = path.endsWith("/") ? "tree" : "blob";
  return `https://github.com/${owner}/${repo}/${kind}/HEAD/${segments.join("/")}${suffix}`;
}
