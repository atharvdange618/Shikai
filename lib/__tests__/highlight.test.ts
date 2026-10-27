import { describe, expect, it } from "vitest";

import {
  MAX_HIGHLIGHT_CHARS,
  MAX_HIGHLIGHT_LINES,
  highlightFile,
  languageFor,
} from "@/lib/highlight";

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
