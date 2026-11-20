import { renderNodesToHtml } from "@tanstack/highlight/core";
import { describe, expect, it } from "vitest";

import { buildBlameLines } from "@/lib/blame-highlight";
import type { BlameRange } from "@/types/github-graphql.types";

function range(startingLine: number, endingLine: number, oid: string): BlameRange {
  return {
    startingLine,
    endingLine,
    age: 0,
    commit: { oid, messageHeadline: "", committedDate: "", author: null },
  };
}

describe("buildBlameLines", () => {
  it("keeps multiline syntax across commit ranges and colors the following code normally", () => {
    const first = range(1, 1, "old");
    const second = range(2, 4, "new");
    const lines = buildBlameLines(
      "/* start\n  still a comment\n*/\nconst answer = 42;\n",
      [first, second],
      "example.ts",
    );

    expect(
      lines.map((line) => [line.lineNumber, line.range.commit.oid, line.isRangeStart]),
    ).toEqual([
      [1, "old", true],
      [2, "new", true],
      [3, "new", false],
      [4, "new", false],
    ]);
    expect(renderNodesToHtml(lines[1].nodes)).toMatch(/th-comment[^>]*>.*still a comment/);
    expect(renderNodesToHtml(lines[2].nodes)).toMatch(/th-comment[^>]*>\*\//);
    const code = renderNodesToHtml(lines[3].nodes);
    expect(code).toMatch(/th-keyword[^>]*>const/);
    expect(code).not.toContain("th-comment");
  });

  it("preserves blank source rows and line numbers when blame skips a range", () => {
    const lines = buildBlameLines(
      "const a = 1;\n\nconst b = 2;\nconst c = 3;\n",
      [range(1, 2, "old"), range(4, 4, "new")],
      "example.ts",
    );
    expect(lines.map((line) => line.lineNumber)).toEqual([1, 2, 4]);
    expect(renderNodesToHtml(lines[1].nodes)).toBe("");
    expect(renderNodesToHtml(lines[2].nodes).replace(/<[^>]+>/g, "")).toBe("const c = 3;");
  });
});
