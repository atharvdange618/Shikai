import { describe, expect, it } from "vitest";

import { themes } from "@/constants/themes";
import { buildCodeHtml, buildSvgHtml } from "@/lib/file-html";
import { highlightFile } from "@/lib/highlight";

const { colors, syntaxTheme } = themes.dark;

describe("buildSvgHtml", () => {
  it("keeps a quote in the URL inside the src attribute", () => {
    const html = buildSvgHtml(
      'https://x.test/a.svg"><script>alert(1)</script>',
      "#000",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain(
      'src="https://x.test/a.svg&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"',
    );
  });

  it("leaves a normal URL readable", () => {
    expect(buildSvgHtml("https://x.test/a.svg?raw=1&v=2", "#000")).toContain(
      'src="https://x.test/a.svg?raw=1&amp;v=2"',
    );
  });
});

describe("buildCodeHtml", () => {
  const file = highlightFile("a\nb\nc", "a.txt", 2);

  it("scrolls to a valid target line", () => {
    expect(buildCodeHtml(file, colors, syntaxTheme, 2)).toContain(
      `querySelector('[data-line="2"]')`,
    );
  });

  it("adds no scroll without a target", () => {
    expect(buildCodeHtml(file, colors, syntaxTheme, undefined)).not.toContain(
      "scrollIntoView({ block",
    );
  });

  it("marks the target line with more than color", () => {
    expect(buildCodeHtml(file, colors, syntaxTheme, 2)).toMatch(
      /\.th-target \{[^}]*box-shadow: inset 3px 0 0/,
    );
  });
});
