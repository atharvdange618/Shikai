import { createHighlighter } from "@tanstack/highlight/core";
import * as languages from "@tanstack/highlight/languages";

import { getLanguage } from "@/lib/utils";

const highlighter = createHighlighter({
  languages: Object.values(languages),
});

// ponytail: files past either cap render as plaintext. Highlighting runs on
// the JS thread at roughly 60ms per 1000 lines in dev Hermes, so a huge file
// would freeze taps. The character cap catches minified files, which are one
// long line. Plaintext stays cheap: 62ms for a 1 MB, 28k-line file in Node,
// and GitHub sends no content past 1 MB. If big files matter, run
// highlight() inside the WebView, where V8 does the same work about 10x
// faster.
export const MAX_HIGHLIGHT_LINES = 5000;
export const MAX_HIGHLIGHT_CHARS = 200_000;

/**
 * The highlighter language for a file name. Tries the extension first since
 * the highlighter knows more aliases than getLanguage (tsx, kt, Dockerfile).
 */
export function languageFor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  // The highlighter's aliases miss .gradle.
  const byExtension = highlighter.normalizeLanguage(
    ext === "gradle" ? "groovy" : ext,
  );
  if (byExtension !== "plaintext") return byExtension;
  return highlighter.normalizeLanguage(getLanguage(fileName));
}

export interface HighlightedFile {
  /** `<pre>` markup with one `.th-line[data-line]` element per line. */
  html: string;
  lang: string;
  lineCount: number;
}

export function highlightFile(
  content: string,
  fileName: string,
  targetLine?: number,
): HighlightedFile {
  // Files end with a newline, which would otherwise render an empty last line.
  const code = content.endsWith("\n") ? content.slice(0, -1) : content;
  const lineCount = code.split("\n").length;
  const lang =
    lineCount > MAX_HIGHLIGHT_LINES || code.length > MAX_HIGHLIGHT_CHARS
      ? "plaintext"
      : languageFor(fileName);
  const hasTarget =
    targetLine !== undefined &&
    targetLine >= 1 &&
    targetLine <= lineCount;

  const { html } = highlighter.highlight(code, {
    lang,
    lineNumbers: true,
    decorations: hasTarget
      ? [{ lines: targetLine, className: "th-target" }]
      : undefined,
  });

  return { html, lang, lineCount };
}
