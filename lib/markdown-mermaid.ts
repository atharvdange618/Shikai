import { escapeHtml } from "@tanstack/highlight/core";
import { render, register, supports } from "pele/core";
import classDiagram from "pele/diagrams/class";
import erDiagram from "pele/diagrams/er";
import flowchart from "pele/diagrams/flowchart";
import gantt from "pele/diagrams/gantt";
import gitGraph from "pele/diagrams/gitGraph";
import pie from "pele/diagrams/pie";
import sequence from "pele/diagrams/sequence";
import stateDiagram from "pele/diagrams/state";

register(flowchart, sequence, classDiagram, stateDiagram, erDiagram, gantt, pie, gitGraph);

/** Normalized diagram source mapped to the SVG rendered for it. */
export type MermaidSvgs = Record<string, string>;

/**
 * Diagram types beyond this are left as source. Pele renders synchronously on
 * the JS thread, so an untrusted README with hundreds of diagrams would
 * otherwise stall the list while the page builds.
 */
const MAX_DIAGRAMS = 20;

/** Up to three spaces of indent, a code fence, then an optional info string. */
const FENCE_OPEN = /^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)/;

/**
 * The key both sides match on: this map here, and the `pre` text the page
 * script reads back out of GitHub's HTML.
 */
export function normalizeMermaidSource(source: string): string {
  return source.replace(/\r\n/g, "\n").trim();
}

function* findMermaidBlocks(lines: string[]) {
  let index = 0;

  while (index < lines.length) {
    const open = FENCE_OPEN.exec(lines[index]);
    if (!open) {
      index += 1;
      continue;
    }

    const [, indent, fence, language] = open;
    const marker = fence[0] === "`" ? "`" : "~";
    const closer = new RegExp("^ {0,3}" + marker + "{" + fence.length + ",}[ \\t]*$");
    const start = index;

    index += 1;
    while (index < lines.length && !closer.test(lines[index])) {
      index += 1;
    }

    if (language.toLowerCase() === "mermaid") {
      const content = lines.slice(start + 1, index);
      const leadingSpaces = new RegExp("^ {0," + indent.length + "}");
      const source = content.map((line) => line.replace(leadingSpaces, "")).join("\n");
      yield { start, end: index + 1, source };
    }
    index += 1;
  }
}

/**
 * Every ```mermaid fenced block in a document, in order. Reads backtick and
 * tilde fences, indented fences, and an info string after the language.
 */
export function extractMermaidBlocks(markdown: string): string[] {
  return Array.from(findMermaidBlocks(markdown.split(/\r?\n/)), (block) => block.source);
}

/** Keeps source readable and marks Mermaid fences for the WebView's diagram pass. */
export function buildMarkdownFallback(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let start = 0;

  for (const block of findMermaidBlocks(lines)) {
    if (block.start > start) {
      html.push(
        `<pre><code>${escapeHtml(lines.slice(start, block.start).join("\n"))}</code></pre>`,
      );
    }
    html.push(`<pre><code class="language-mermaid">${escapeHtml(block.source)}</code></pre>`);
    start = block.end;
  }

  if (start < lines.length) {
    html.push(`<pre><code>${escapeHtml(lines.slice(start).join("\n"))}</code></pre>`);
  }

  return html.join("\n");
}

/**
 * Renders a document's diagrams ahead of the page build, so the WebView inlines
 * finished SVG and never fetches a renderer. A block that fails to parse, or
 * whose type is not registered, is left out and shown as source instead.
 */
export function renderMermaidBlocks(markdown: string): MermaidSvgs {
  const svgs: MermaidSvgs = {};
  let rendered = 0;

  for (const block of extractMermaidBlocks(markdown)) {
    if (rendered >= MAX_DIAGRAMS) break;

    const source = normalizeMermaidSource(block);
    if (source === "" || Object.hasOwn(svgs, source) || !supports(source)) continue;

    try {
      svgs[source] = render(source, { links: false }).svg;
      rendered += 1;
    } catch {
      continue;
    }
  }

  return svgs;
}
