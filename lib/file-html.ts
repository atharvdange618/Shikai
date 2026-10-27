import { escapeHtml } from "@tanstack/highlight/core";
import type { HighlightTheme } from "@tanstack/highlight/theme";
import { createThemeRule, themeTokenClasses } from "@tanstack/highlight/theme";

import type { ColorTokens } from "@/constants/themes";
import type { HighlightedFile } from "@/lib/highlight";

// Page builders for the file viewers' WebViews. Kept out of the components so
// Vitest can check them without React Native.

export function buildCodeHtml(
  file: HighlightedFile,
  colors: ColorTokens,
  syntaxTheme: HighlightTheme,
  targetLine: number | undefined,
): string {
  const gutter = `${String(file.lineCount).length}ch`;
  const tokenRules = themeTokenClasses
    .map((token) => `.th-${token} { color: var(--th-${token}); }`)
    .join("\n");
  const scrollToTarget =
    targetLine !== undefined && Number.isInteger(targetLine)
      ? `var t = document.querySelector('[data-line="${targetLine}"]');
         if (t) t.scrollIntoView({ block: "center" });`
      : "";

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
  /* Drops the newlines between line elements; each .th-line sets its own
     white-space. */
  code { display: block; font: inherit; white-space: normal; }

  /* Line numbers sit in a hanging gutter, so wrapped lines stay indented
     under their own number. */
  .th-line {
    display: block;
    position: relative;
    min-height: 1.6em;
    padding: 0 16px 0 calc(${gutter} + 28px);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .th-line::before {
    content: attr(data-line);
    position: absolute;
    left: 0;
    width: calc(${gutter} + 12px);
    text-align: right;
    color: ${colors.textMuted};
    user-select: none;
    -webkit-user-select: none;
  }
  /* ponytail: with wrap off the gutter scrolls away sideways with the code.
     A sticky gutter needs the numbers in their own column. */
  body.nowrap .th-line {
    white-space: pre;
    overflow-wrap: normal;
    width: max-content;
    min-width: 100%;
    box-sizing: border-box;
  }
  /* The inset bar marks the line without relying on color alone. */
  .th-target {
    background: ${colors.accentSubtle};
    box-shadow: inset 3px 0 0 ${colors.accent};
  }
  .th-target::before { color: ${colors.accent}; }
</style>
</head>
<body>
${file.html}
<script>
  function setWrap(on) {
    if (document.body.classList.contains('nowrap') !== on) return;
    var el = document.elementFromPoint(4, 4);
    var anchor = el && el.closest ? el.closest('.th-line') : null;
    document.body.classList.toggle('nowrap', !on);
    if (anchor) anchor.scrollIntoView();
  }
  ${scrollToTarget}
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
