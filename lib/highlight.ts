import {
  createHighlighter,
  renderNodesToHtml,
  renderTokens,
  type HighlightRenderNode,
} from "@tanstack/highlight/core";
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
  const byExtension = highlighter.normalizeLanguage(ext === "gradle" ? "groovy" : ext);
  if (byExtension !== "plaintext") return byExtension;
  return highlighter.normalizeLanguage(getLanguage(fileName));
}

export interface HighlightedFile {
  html: string;
  lang: string;
  lineCount: number;
}

function languageForContent(code: string, lineCount: number, fileName: string): string {
  return lineCount > MAX_HIGHLIGHT_LINES || code.length > MAX_HIGHLIGHT_CHARS
    ? "plaintext"
    : languageFor(fileName);
}

function renderCodeLines(code: string, lang: string): HighlightRenderNode[][] {
  const { tokens } = highlighter.tokenize(code, { lang });
  return renderTokens(tokens, { lineNumbers: true })
    .filter((node) => node.type === "element")
    .map((node) => node.children);
}

export function highlightFileLines(lines: string[], fileName: string): HighlightRenderNode[][] {
  const code = lines.join("\n");
  return renderCodeLines(code, languageForContent(code, lines.length, fileName));
}

export function highlightFile(
  content: string,
  fileName: string,
  targetLine?: number,
): HighlightedFile {
  const code = content.endsWith("\n") ? content.slice(0, -1) : content;
  const lineCount = code.split("\n").length;
  const lang = languageForContent(code, lineCount, fileName);
  const hasTarget = targetLine !== undefined && targetLine >= 1 && targetLine <= lineCount;

  const { tokens } = highlighter.tokenize(code, { lang });
  const rows = renderTokens(tokens, {
    lineNumbers: true,
    decorations: hasTarget ? [{ lines: targetLine, className: "th-target" }] : undefined,
  });
  for (const row of rows) {
    if (row.type !== "element") continue;
    row.children = [
      {
        type: "element",
        classNames: ["th-gutter"],
        children: [{ type: "text", value: row.data?.line ?? "" }],
      },
      { type: "element", classNames: ["th-line-content"], children: row.children },
    ];
  }
  const html = `<pre class="th-code"><code>${renderNodesToHtml(rows)}</code></pre>`;

  return { html, lang, lineCount };
}

export type DiffLineKind = "add" | "del" | "context" | "hunk" | "meta";

export interface DiffLine {
  kind: DiffLineKind;
  oldLine?: number;
  newLine?: number;
  /** Highlighted content, without the leading `+`, `-` or space. */
  nodes: HighlightRenderNode[];
}

export interface HighlightedDiff {
  lines: DiffLine[];
  lang: string;
}

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

function textLine(kind: DiffLineKind, value: string): DiffLine {
  return { kind, nodes: [{ type: "text", value }] };
}

/**
 * Parses a unified diff patch (GitHub's `patch` / `diff_hunk`) and highlights
 * the code in the file's language. Each hunk is tokenized on its own, since
 * the code between hunks is missing and the headers aren't code.
 */
export function highlightDiff(patch: string, fileName: string): HighlightedDiff {
  const text = patch.endsWith("\n") ? patch.slice(0, -1) : patch;
  const rawLines = text.split("\n");
  const lang = languageForContent(text, rawLines.length, fileName);

  const lines: DiffLine[] = [];
  let hunk: { code: string[]; lines: DiffLine[] } | null = null;
  let oldLine = 0;
  let newLine = 0;

  const flush = () => {
    if (!hunk || hunk.code.length === 0) return;
    const rendered = renderCodeLines(hunk.code.join("\n"), lang);
    hunk.lines.forEach((line, i) => {
      line.nodes = rendered[i] ?? [];
    });
    lines.push(...hunk.lines);
    hunk = null;
  };

  for (const raw of rawLines) {
    const header = HUNK_HEADER.exec(raw);
    if (header) {
      flush();
      oldLine = Number(header[1]);
      newLine = Number(header[2]);
      lines.push(textLine("hunk", raw));
      hunk = { code: [], lines: [] };
      continue;
    }
    if (raw.startsWith("\\") || !hunk) {
      flush();
      lines.push(textLine("meta", raw));
      if (raw.startsWith("\\")) hunk = { code: [], lines: [] };
      continue;
    }

    const sign = raw[0];
    const line: DiffLine =
      sign === "+"
        ? { kind: "add", newLine: newLine++, nodes: [] }
        : sign === "-"
          ? { kind: "del", oldLine: oldLine++, nodes: [] }
          : { kind: "context", oldLine: oldLine++, newLine: newLine++, nodes: [] };
    hunk.code.push(raw.slice(1));
    hunk.lines.push(line);
  }
  flush();

  return { lines, lang };
}
