import { describe, expect, it } from "vitest";

import {
  MAX_HIGHLIGHT_CHARS,
  MAX_HIGHLIGHT_LINES,
  highlightDiff,
  highlightFile,
  languageFor,
} from "@/lib/highlight";
import { renderNodesToHtml } from "@tanstack/highlight/core";

describe("languageFor", () => {
  it("uses the extension when the highlighter knows it", () => {
    expect(languageFor("App.tsx")).toBe("tsx");
    expect(languageFor("Main.kt")).toBe("kotlin");
    expect(languageFor("build.gradle")).toBe("groovy");
  });

  it("handles extensionless names the highlighter knows", () => {
    expect(languageFor("Dockerfile")).toBe("dockerfile");
    expect(languageFor("Makefile")).toBe("makefile");
  });

  it("falls back to plaintext for unknown files", () => {
    expect(languageFor("data.parquet")).toBe("plaintext");
    expect(languageFor("LICENSE")).toBe("plaintext");
  });
});

describe("highlightFile", () => {
  it("renders one element per line with its number", () => {
    const { html, lineCount } = highlightFile("const a = 1;\nlet b;\n", "a.ts");
    expect(lineCount).toBe(2);
    expect(html.match(/class="th-line[^"]*"/g)).toHaveLength(2);
    expect(html).toContain('data-line="2"');
  });

  it("drops only the final newline", () => {
    expect(highlightFile("a\n\n", "a.txt").lineCount).toBe(2);
    expect(highlightFile("a", "a.txt").lineCount).toBe(1);
  });

  it("escapes code so file contents can't inject markup", () => {
    const { html } = highlightFile('<img src=x onerror="alert(1)">', "a.txt");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("marks the target line", () => {
    const { html } = highlightFile("a\nb\nc", "a.txt", 2);
    expect(html).toMatch(/class="th-line th-target" data-line="2"/);
  });

  it("ignores a target line outside the file", () => {
    expect(highlightFile("a\nb", "a.txt", 9).html).not.toContain("th-target");
    expect(highlightFile("a\nb", "a.txt", 0).html).not.toContain("th-target");
  });

  it("skips highlighting past the size cap", () => {
    const big = "let x = 1;\n".repeat(MAX_HIGHLIGHT_LINES + 1);
    const { lang, html } = highlightFile(big, "big.ts");
    expect(lang).toBe("plaintext");
    expect(html).not.toContain("th-keyword");
  });

  it("skips highlighting a minified file past the character cap", () => {
    const minified = "var a=1;".repeat(MAX_HIGHLIGHT_CHARS / 8 + 1);
    const { lang, lineCount, html } = highlightFile(minified, "app.min.js");
    expect(lineCount).toBe(1);
    expect(lang).toBe("plaintext");
    expect(html).not.toContain("th-keyword");
  });
});

describe("highlightDiff", () => {
  const patch = [
    "@@ -10,3 +10,4 @@ function f() {",
    " const a = 1;",
    "-let b = 2;",
    "+let b = 3;",
    "+let c = 4;",
    " return a;",
  ].join("\n");

  it("numbers old and new lines from the hunk header", () => {
    const { lines } = highlightDiff(patch, "a.ts");
    expect(lines.map((l) => [l.kind, l.oldLine, l.newLine])).toEqual([
      ["hunk", undefined, undefined],
      ["context", 10, 10],
      ["del", 11, undefined],
      ["add", undefined, 11],
      ["add", undefined, 12],
      ["context", 12, 13],
    ]);
  });

  it("strips the sign and highlights in the file's language", () => {
    const { lines, lang } = highlightDiff(patch, "a.ts");
    expect(lang).toBe("ts");
    const html = renderNodesToHtml(lines[3].nodes);
    expect(html).toContain('<span class="th-token th-keyword">let</span>');
    expect(html).not.toContain("+");
  });

  it("restarts numbering at each hunk", () => {
    const { lines } = highlightDiff(
      "@@ -1 +1 @@\n-a\n+b\n@@ -50,2 +60,2 @@\n x\n y",
      "a.txt",
    );
    expect(lines.filter((l) => l.kind === "hunk")).toHaveLength(2);
    expect(lines[4]).toMatchObject({ kind: "context", oldLine: 50, newLine: 60 });
  });

  it("keeps a no-newline marker as a meta line without a number", () => {
    const { lines } = highlightDiff(
      "@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+a",
      "a.txt",
    );
    expect(lines.map((l) => l.kind)).toEqual(["hunk", "del", "meta", "add"]);
    expect(lines[3].newLine).toBe(1);
  });

  it("keeps blank context lines", () => {
    const { lines } = highlightDiff("@@ -1,2 +1,2 @@\n \n a", "a.txt");
    expect(lines[1]).toMatchObject({ kind: "context", oldLine: 1, nodes: [] });
  });

  it("escapes code so a patch can't inject markup", () => {
    const { lines } = highlightDiff('@@ -1 +1 @@\n+<img onerror="x">', "a.html");
    expect(renderNodesToHtml(lines[1].nodes)).not.toContain("<img");
  });

  it("skips highlighting past the size cap", () => {
    const big = "@@ -1 +1 @@\n" + "+let x = 1;\n".repeat(MAX_HIGHLIGHT_LINES);
    expect(highlightDiff(big, "big.ts").lang).toBe("plaintext");
  });
});
