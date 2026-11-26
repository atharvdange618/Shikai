import { describe, expect, it } from "vitest";

import { buildHtml } from "@/lib/markdown-html";
import { buildMarkdownPreview, normalizeMermaidSource } from "@/lib/markdown-mermaid";

/** Builds a function the way the WebView builds the page's own script. */
function pageFunction(body: string, ...args: string[]): (...values: string[]) => string {
  // eslint-disable-next-line typescript/no-implied-eval -- compiles and runs the page's own script text
  const run = new Function(...args, body) as (...values: string[]) => string;
  return run;
}

interface FakeCode {
  className: string;
}
interface FakePre {
  getAttribute: (name: string) => string | null;
}
type RawLang = (code: FakeCode | null, pre: FakePre) => string;

function detectLang(codeClass: string | null, langAttr: string | null): string {
  const statement = /var rawLang = [^\n]+;/.exec(buildHtml("", false, 16))?.[0];
  if (!statement) throw new Error("rawLang statement not found in page script");
  // eslint-disable-next-line typescript/no-implied-eval -- runs the page's own script line
  const run = new Function("code", "pre", `${statement} return rawLang;`) as RawLang;
  return run(codeClass === null ? null : { className: codeClass }, {
    getAttribute: (name) => (name === "lang" ? langAttr : null),
  });
}

describe("buildHtml raw code block language", () => {
  it.each([
    ["language-typescript", "typescript"],
    ["language-python3", "python3"],
    ["language-c++", "c++"],
    ["language-objective-c", "objective-c"],
  ])("reads the %s class as %s", (className, lang) => {
    expect(detectLang(className, null)).toBe(lang);
  });

  it("reads the lang attribute GitHub puts on unknown languages", () => {
    expect(detectLang("notranslate", "made-up-lang")).toBe("made-up-lang");
  });

  it("reads the lang attribute when the block has no <code>", () => {
    expect(detectLang(null, "mermaid")).toBe("mermaid");
  });

  it("finds no language on a plain block", () => {
    expect(detectLang("notranslate", null)).toBe("");
  });
});

describe("buildHtml mermaid data", () => {
  it("embeds the rendered SVG record for the page script", () => {
    const page = buildHtml("", false, 16, {
      "flowchart LR\n  A --> B": '<svg class="pele"></svg>',
    });

    expect(page).toContain('id="pele-svgs"');
    expect(page).toContain('\\u003csvg class=\\"pele\\"');
  });

  it("keeps a closing script tag in a label from ending the data block", () => {
    const page = buildHtml("", false, 16, { source: "<script>alert(1)</script>" });

    expect(page).not.toContain("<script>alert(1)</script>");
  });

  it("leaves an empty record when there are no diagrams", () => {
    expect(buildHtml("", false, 16)).toContain('id="pele-svgs">{}</script>');
  });

  it("generates a page script that parses", () => {
    const page = buildHtml("", true, 16, { source: "<svg></svg>" });
    const script = /<script>\n([\s\S]*?)<\/script>/.exec(page)?.[1];

    expect(script).toBeTruthy();
    expect(() => pageFunction(script ?? "")).not.toThrow();
  });

  it("normalizes a diagram key the same way the renderer does", () => {
    const page = buildHtml("", false, 16);
    const keyFunction = /function mermaidKey\(source\) \{[\s\S]*?\n  \}/.exec(page)?.[0];

    expect(keyFunction).toBeTruthy();
    const key = pageFunction(`${keyFunction ?? ""}\nreturn mermaidKey(source);`, "source");

    expect(key("\r\n flowchart LR\r\n  A --> B \r\n")).toBe(
      normalizeMermaidSource("\r\n flowchart LR\r\n  A --> B \r\n"),
    );
  });

  it("matches an indented fence to the dedented source in GitHub HTML", () => {
    const markdown = "  ```mermaid\n  flowchart LR\n    A --> B\n  ```";
    const githubText = "flowchart LR\n  A --> B\n";
    const page = buildHtml("", false, 16, buildMarkdownPreview(markdown).mermaidSvgs);
    const keyFunction = /function mermaidKey\(source\) \{[\s\S]*?\n  \}/.exec(page)?.[0];
    const data = /id="pele-svgs">([^<]*)<\/script>/.exec(page)?.[1];
    const lookup = pageFunction(
      `${keyFunction ?? ""}\nreturn JSON.parse(data)[mermaidKey(source)];`,
      "source",
      "data",
    );

    expect(lookup(githubText, data ?? "{}")).toContain("pele-flowchart");
  });
});
