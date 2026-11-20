import { spawnSync } from "node:child_process";
import { mkdtempSync, unlinkSync, rmdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function lintSource(source: string) {
  const directory = mkdtempSync(join(tmpdir(), "shikai-comments-"));
  const file = join(directory, "fixture.config.tsx");
  writeFileSync(file, source);
  try {
    const result = spawnSync(
      process.execPath,
      [
        resolve("node_modules/oxlint/bin/oxlint"),
        "-c",
        resolve("scripts/oxlint-comments.json"),
        file,
      ],
      { encoding: "utf8" },
    );
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    unlinkSync(file);
    rmdirSync(directory);
  }
}

describe("JSDoc-only comment lint", () => {
  it("allows JSDoc, URLs, regular expressions and comment-like string content", () => {
    const result = lintSource(
      [
        "/** A public field. */",
        'export const url = "https://example.com";',
        'export const css = "/* template data */";',
        String.raw`export const pattern = /\/\/[^\n]*/;`,
      ].join("\n"),
    );
    expect(result.status, result.output).toBe(0);
  });

  it("rejects line, block and JSX comments", () => {
    const result = lintSource(
      "// standalone\nexport const node = <div>{/* JSX */}</div>; /* inline */",
    );
    expect(result.status).toBe(1);
    expect(result.output.match(/Only JSDoc comments are allowed/g)).toHaveLength(3);
  });

  it("rejects new directives that try to disable the rule", () => {
    const result = lintSource("// oxlint-disable shikai/jsdoc-only\nexport const value = 1;");
    expect(result.status).toBe(1);
    expect(result.output).toContain("Only JSDoc comments are allowed");
  });
});
