const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const ALLOWED_SCHEME_RE = /^(https?|mailto):/i;

export const isSafeExternalUrl = (url: string): boolean => ALLOWED_SCHEME_RE.test(url);

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

  const segments = path.startsWith("/") ? [] : (filePath ?? "").split("/").slice(0, -1);
  for (const part of path.split("/")) {
    if (part === "..") segments.pop();
    else if (part !== "." && part !== "") segments.push(part);
  }

  const kind = path.endsWith("/") ? "tree" : "blob";
  return `https://github.com/${owner}/${repo}/${kind}/HEAD/${segments.join("/")}${suffix}`;
}
