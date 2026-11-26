import { describe, expect, it } from "vitest";

import {
  buildMarkdownFallback,
  extractMermaidBlocks,
  normalizeMermaidSource,
  renderMermaidBlocks,
} from "@/lib/markdown-mermaid";

describe("buildMarkdownFallback", () => {
  it("makes Mermaid fences available to the WebView and escapes the surrounding source", () => {
    const markdown = [
      "# <script>before</script>",
      "~~~Mermaid",
      "flowchart LR",
      '  A["Hello & goodbye"] --> B',
      "~~~",
      "After",
      "```mermaid",
      "journey",
      "  title My day",
      "```",
    ].join("\r\n");

    const html = buildMarkdownFallback(markdown);

    expect(html).toContain("<pre><code># &lt;script&gt;before&lt;/script&gt;</code></pre>");
    expect(html).toMatch(
      /<pre><code class="language-mermaid">flowchart LR\n  A\[.*Hello &amp; goodbye.*\] --&gt; B<\/code><\/pre>/,
    );
    expect(html).toContain("<pre><code>After</code></pre>");
    expect(html).toContain(
      '<pre><code class="language-mermaid">journey\n  title My day</code></pre>',
    );
  });

  it("keeps Mermaid examples inside other fences as plain text", () => {
    const markdown = "````md\n```mermaid\nflowchart LR\n  A --> B\n```\n````";

    expect(buildMarkdownFallback(markdown)).toBe(
      "<pre><code>````md\n```mermaid\nflowchart LR\n  A --&gt; B\n```\n````</code></pre>",
    );
  });
});

describe("extractMermaidBlocks", () => {
  it("reads backtick and tilde fences", () => {
    const markdown = "```mermaid\nflowchart LR\n  A --> B\n```\n\n~~~mermaid\nA->>B: hi\n~~~";

    expect(extractMermaidBlocks(markdown)).toEqual(["flowchart LR\n  A --> B", "A->>B: hi"]);
  });

  it("ignores every other language", () => {
    const markdown = "```ts\nconst a = 1;\n```\n\n```mermaid\nflowchart LR\n  A --> B\n```";

    expect(extractMermaidBlocks(markdown)).toEqual(["flowchart LR\n  A --> B"]);
  });

  it("reads an indented fence and an info string", () => {
    const markdown = "- step\n\n  ```mermaid title=Flow\n  flowchart LR\n    A --> B\n  ```";

    expect(extractMermaidBlocks(markdown)).toEqual(["flowchart LR\n  A --> B"]);
  });

  it("keeps a shorter fence inside a longer one", () => {
    const markdown = "````mermaid\n```\nflowchart LR\n```\n````";

    expect(extractMermaidBlocks(markdown)).toEqual(["```\nflowchart LR\n```"]);
  });

  it("takes the rest of the document as an unclosed block", () => {
    expect(extractMermaidBlocks("```mermaid\nflowchart LR\n  A --> B")).toEqual([
      "flowchart LR\n  A --> B",
    ]);
  });

  it("finds nothing in a document without diagrams", () => {
    expect(extractMermaidBlocks("# Notes\n\nSome prose.\n\n```js\nlet a = 1;\n```")).toEqual([]);
  });
});

describe("normalizeMermaidSource", () => {
  it("unifies line endings and trims the edges", () => {
    expect(normalizeMermaidSource("\r\n flowChart LR\r\n  A --> B \r\n")).toBe(
      "flowChart LR\n  A --> B",
    );
  });
});

describe("renderMermaidBlocks", () => {
  it("returns inline SVG for a supported diagram", () => {
    const svgs = renderMermaidBlocks("```mermaid\nflowchart LR\n  A --> B\n```");
    const svg = svgs["flowchart LR\n  A --> B"];

    expect(svg).toContain("<svg");
    expect(svg).toContain("pele-flowchart");
    expect(svg).not.toContain("<script");
  });

  it("keys the record by the normalized source", () => {
    const svgs = renderMermaidBlocks("```mermaid\n sequenceDiagram\n  A->>B: hi\n```");

    expect(Object.keys(svgs)).toEqual(["sequenceDiagram\n  A->>B: hi"]);
  });

  it("renders a repeated diagram once", () => {
    const block = "```mermaid\nflowchart LR\n  A --> B\n```";

    expect(Object.keys(renderMermaidBlocks(block + "\n\n" + block))).toHaveLength(1);
  });

  it("skips a diagram type that is not registered", () => {
    expect(renderMermaidBlocks("```mermaid\nmindmap\n  root\n    child\n```")).toEqual({});
  });

  it("skips a diagram that does not parse", () => {
    expect(renderMermaidBlocks("```mermaid\nflowchart LR\n  A --> \n```")).toEqual({});
  });

  it("stops at twenty diagrams", () => {
    const blocks = Array.from(
      { length: 25 },
      (_, index) => "```mermaid\nflowchart LR\n  A" + index + " --> B\n```",
    );

    expect(Object.keys(renderMermaidBlocks(blocks.join("\n\n")))).toHaveLength(20);
  });

  it("returns an empty record for markdown without diagrams", () => {
    expect(renderMermaidBlocks("# Notes\n\nSome prose.")).toEqual({});
  });
});
