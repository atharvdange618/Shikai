import { describe, expect, it } from "vitest";

import { buildMarkdownPreview, normalizeMermaidSource } from "@/lib/markdown-mermaid";

function renderMermaidBlocks(markdown: string) {
  return buildMarkdownPreview(markdown).mermaidSvgs;
}

describe("buildMarkdownPreview", () => {
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

    const { html } = buildMarkdownPreview(markdown);

    expect(html).toContain("&lt;script&gt;before&lt;/script&gt;");
    expect(html).toMatch(
      /<pre><code class="language-mermaid">flowchart LR\n  A\[.*Hello &amp; goodbye.*\] --&gt; B<\/code><\/pre>/,
    );
    expect(html).toContain("<p>After</p>");
    expect(html).toContain(
      '<pre><code class="language-mermaid">journey\n  title My day</code></pre>',
    );
  });

  it("keeps Mermaid examples inside other fences as plain text", () => {
    const markdown = "````md\n```mermaid\nflowchart LR\n  A --> B\n```\n````";

    const { html, mermaidSvgs } = buildMarkdownPreview(markdown);
    expect(html).toContain("```mermaid\nflowchart LR\n  A --&gt; B\n```");
    expect(mermaidSvgs).toEqual({});
  });

  it("shows Markdown link and image labels without activating their URLs", () => {
    const { html } = buildMarkdownPreview(
      "[Link](https://example.com) ![Diagram](https://example.com/image.png)",
    );

    expect(html).toBe("<p>Link Diagram</p>");
  });
});

describe("Markdown fence syntax", () => {
  it("reads backtick and tilde fences", () => {
    const markdown =
      "```mermaid\nflowchart LR\n  A --> B\n```\n\n~~~mermaid\nsequenceDiagram\nA->>B: hi\n~~~";

    expect(Object.keys(renderMermaidBlocks(markdown))).toEqual([
      "flowchart LR\n  A --> B",
      "sequenceDiagram\nA->>B: hi",
    ]);
  });

  it("ignores every other language", () => {
    const markdown = "```ts\nconst a = 1;\n```\n\n```mermaid\nflowchart LR\n  A --> B\n```";

    expect(Object.keys(renderMermaidBlocks(markdown))).toEqual(["flowchart LR\n  A --> B"]);
  });

  it("reads an indented fence and an info string", () => {
    const markdown = "- step\n\n  ```mermaid title=Flow\n  flowchart LR\n    A --> B\n  ```";

    expect(Object.keys(renderMermaidBlocks(markdown))).toEqual(["flowchart LR\n  A --> B"]);
  });

  it("keeps a shorter fence inside a longer one", () => {
    const markdown = "````mermaid\n```\nflowchart LR\n```\n````";

    expect(buildMarkdownPreview(markdown).html).toContain("```\nflowchart LR\n```");
  });

  it("takes the rest of the document as an unclosed block", () => {
    expect(Object.keys(renderMermaidBlocks("```mermaid\nflowchart LR\n  A --> B"))).toEqual([
      "flowchart LR\n  A --> B",
    ]);
  });

  it("finds nothing in a document without diagrams", () => {
    expect(renderMermaidBlocks("# Notes\n\nSome prose.\n\n```js\nlet a = 1;\n```")).toEqual({});
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
  it("renders fenced diagrams in blockquotes and ordered list items", () => {
    const quoted = ["> ```mermaid", "> flowchart LR", ">   A --> B", "> ```"].join("\n");
    const listed = [
      "100. Step",
      "",
      "     ```mermaid",
      "     sequenceDiagram",
      "     A->>B: hi",
      "     ```",
    ].join("\n");
    const markdown = `${quoted}\n\n${listed}`;

    expect(Object.keys(renderMermaidBlocks(markdown))).toEqual([
      "flowchart LR\n  A --> B",
      "sequenceDiagram\nA->>B: hi",
    ]);
    const { html } = buildMarkdownPreview(markdown);
    expect(html).toContain('<blockquote>\n<pre><code class="language-mermaid">');
    expect(html).toContain('<ol start="100">');
  });

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

  it("renders diagrams without embedding remote images", () => {
    const url = "https://example.com/diagram.png";
    const source = `flowchart LR\n  A@{ img: "${url}", label: "Example" } --> B`;
    const svg = renderMermaidBlocks(`\`\`\`mermaid\n${source}\n\`\`\``)[source];

    expect(svg).toContain("<svg");
    expect(svg).not.toContain(url);
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
