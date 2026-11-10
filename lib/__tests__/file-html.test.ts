import { describe, expect, it } from "vitest";

import { themes } from "@/constants/themes";
import { buildCodeHtml, buildDiffHtml, buildSvgHtml } from "@/lib/file-html";
import { highlightDiff, highlightFile } from "@/lib/highlight";

const { colors, syntaxTheme } = themes.dark;

describe("buildSvgHtml", () => {
  it("keeps a quote in the URL inside the src attribute", () => {
    const html = buildSvgHtml('https://x.test/a.svg"><script>alert(1)</script>', "#000");
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

describe("buildDiffHtml", () => {
  const diff = highlightDiff("@@ -9,2 +9,2 @@\n-old();\n+fresh();\n same();", "a.ts");
  const html = buildDiffHtml(diff, colors, syntaxTheme);

  it("puts old and new numbers and the sign on each code line", () => {
    expect(html).toContain('class="th-line th-del" data-old="9" data-new="" data-sign="-"');
    expect(html).toContain('class="th-line th-add" data-old="" data-new="9" data-sign="+"');
    expect(html).toContain('class="th-line th-context" data-old="10" data-new="10"');
  });

  it("leaves hunk headers without numbers", () => {
    expect(html).toContain('<span class="th-line th-hunk">@@ -9,2 +9,2 @@</span>');
  });

  it("escapes patch content", () => {
    const evil = highlightDiff("@@ -1 +1 @@\n+<script>alert(1)</script>", "a.txt");
    expect(buildDiffHtml(evil, colors, syntaxTheme)).not.toContain("<script>alert");
  });
});
