import { escapeHtml } from "@tanstack/highlight/core";
import { renderHtml } from "@tanstack/markdown/html";
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

/**
 * The key both sides match on: this map here, and the `pre` text the page
 * script reads back out of GitHub's HTML.
 */
export function normalizeMermaidSource(source: string): string {
  return source.replace(/\r\n/g, "\n").trim();
}

interface MarkdownPreview {
  html: string;
  mermaidSvgs: MermaidSvgs;
}

/** Share one Markdown parse between the local preview and GitHub's diagram replacement pass. */
export function buildMarkdownPreview(markdown: string): MarkdownPreview {
  const mermaidSvgs: MermaidSvgs = {};
  let rendered = 0;

  const html = renderHtml(markdown, {
    allowHtml: false,
    frontmatter: false,
    extensions: [
      {
        name: "shikai-markdown-preview",
        renderHtml(node, context) {
          if (node.type === "image") return escapeHtml(node.alt);
          if (node.type === "link") return node.children.map(context.renderInline).join("");
          if (node.type !== "code" || node.lang?.toLowerCase() !== "mermaid") return undefined;

          const source = normalizeMermaidSource(node.value);
          if (
            rendered < MAX_DIAGRAMS &&
            source !== "" &&
            !Object.hasOwn(mermaidSvgs, source) &&
            supports(source)
          ) {
            try {
              mermaidSvgs[source] = render(source, { links: false, images: false }).svg;
              rendered += 1;
            } catch {
              /** The WebView displays the original source when there is no SVG. */
            }
          }
          return `<pre><code class="language-mermaid">${escapeHtml(node.value)}</code></pre>`;
        },
      },
    ],
  });

  return { html, mermaidSvgs };
}
