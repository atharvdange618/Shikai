import { escapeHtml, renderNodesToHtml } from "@tanstack/highlight/core";
import type { HighlightTheme } from "@tanstack/highlight/theme";
import { createThemeRule, themeTokenClasses } from "@tanstack/highlight/theme";

import type { ColorTokens } from "@/constants/themes";
import type { DiffLineKind, HighlightedDiff, HighlightedFile } from "@/lib/highlight";

export function buildCodeHtml(
  file: HighlightedFile,
  colors: ColorTokens,
  syntaxTheme: HighlightTheme,
  targetLine: number | undefined,
): string {
  const gutter = `${String(file.lineCount).length}ch`;
  const scrollToTarget =
    targetLine !== undefined
      ? `var t = document.querySelector('[data-line="${targetLine}"]');
         if (t) t.scrollIntoView({ block: "center" });`
      : "";

  return buildPage(
    colors,
    syntaxTheme,
    `
  .th-gutter { width: calc(${gutter} + 28px); padding-right: 16px; text-align: right; }
  .th-target {
    background: ${colors.accentSubtle};
    box-shadow: inset 3px 0 0 ${colors.accent};
  }
  .th-target > .th-gutter {
    color: ${colors.accent};
    box-shadow: inset 3px 0 0 ${colors.accent};
  }`,
    file.html,
    scrollToTarget,
  );
}

const DIFF_SIGN: Partial<Record<DiffLineKind, string>> = {
  add: "+",
  del: "-",
  context: " ",
};

export function buildDiffHtml(
  diff: HighlightedDiff,
  colors: ColorTokens,
  syntaxTheme: HighlightTheme,
): string {
  const maxLine = diff.lines.reduce((max, l) => Math.max(max, l.oldLine ?? 0, l.newLine ?? 0), 0);
  const col = `${String(maxLine).length}ch`;
  const body = diff.lines
    .map((line) => {
      const sign = DIFF_SIGN[line.kind];
      const content = renderNodesToHtml(line.nodes);
      if (sign === undefined) return `<span class="th-line th-${line.kind}">${content}</span>`;
      const oldLine = line.oldLine ?? "";
      const newLine = line.newLine ?? "";
      const gutter = `<span class="th-gutter"><span>${oldLine}</span><span>${newLine} ${sign}</span></span>`;
      const attrs = `data-old="${oldLine}" data-new="${newLine}" data-sign="${sign}"`;
      return `<span class="th-line th-${line.kind}" ${attrs}>${gutter}<span class="th-line-content">${content}</span></span>`;
    })
    .join("\n");

  return buildPage(
    colors,
    syntaxTheme,
    `
  .th-gutter {
    display: grid;
    grid-template-columns: ${col} calc(${col} + 2ch);
    column-gap: 8px;
    padding: 0 16px 0 8px;
    text-align: right;
    white-space: pre;
  }
  .th-add { background: ${colors.successSubtle}; }
  .th-del { background: ${colors.dangerSubtle}; }
  .th-add > .th-gutter { box-shadow: inset 3px 0 0 ${colors.success}; }
  .th-del > .th-gutter { box-shadow: inset 3px 0 0 ${colors.danger}; }
  .th-line.th-hunk, .th-line.th-meta { display: block; padding: 0 16px; color: ${colors.textMuted}; }
  .th-hunk { background: ${colors.surfaceSecondary}; }
  .th-meta { font-style: italic; }`,
    `<pre class="th-code"><code>${body}</code></pre>`,
    "",
  );
}

function buildPage(
  colors: ColorTokens,
  syntaxTheme: HighlightTheme,
  lineCss: string,
  bodyHtml: string,
  script: string,
): string {
  const tokenRules = themeTokenClasses
    .map((token) => `.th-${token} { color: var(--th-${token}); }`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  ${createThemeRule(":root", syntaxTheme)}
  ${tokenRules}
  .th-comment { font-style: italic; }

  html, body { margin: 0; background: ${colors.background}; }
  body { -webkit-text-size-adjust: 100%; }
  pre.th-code {
    margin: 0;
    padding: 8px 0 48px;
    overflow-x: auto;
    background: ${colors.background};
    color: ${colors.textPrimary};
    font: 13px/1.6 'JetBrains Mono', 'SF Mono', monospace;
  }
  code { display: block; font: inherit; white-space: normal; }

  .th-line {
    display: flex;
    min-height: 1.6em;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    background: ${colors.background};
  }
  .th-gutter {
    position: sticky;
    left: 0;
    z-index: 1;
    flex: none;
    box-sizing: border-box;
    background: inherit;
    color: ${colors.textMuted};
    user-select: none;
    -webkit-user-select: none;
  }
  .th-line-content { flex: 1; min-width: 0; padding-right: 16px; }
  body.nowrap code { width: max-content; min-width: 100%; }
  body.nowrap .th-line {
    white-space: pre;
    overflow-wrap: normal;
  }
  ${lineCss}
</style>
</head>
<body>
${bodyHtml}
<script>
  function setWrap(on) {
    if (document.body.classList.contains('nowrap') !== on) return;
    var el = document.elementFromPoint(4, 4);
    var anchor = el && el.closest ? el.closest('.th-line') : null;
    document.body.classList.toggle('nowrap', !on);
    if (anchor) anchor.scrollIntoView();
  }
  ${script}
</script>
</body>
</html>`;
}

/** A page that shows one SVG by URL. The URL is escaped into the attribute. */
export function buildSvgHtml(url: string, background: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      margin: 0;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: ${background};
    }
    img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="${escapeHtml(url)}" />
</body>
</html>`;
}
