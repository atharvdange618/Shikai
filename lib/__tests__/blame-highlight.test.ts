import { describe, expect, it } from "vitest";

import { tokenizeLine } from "@/lib/blame-highlight";

describe("tokenizeLine", () => {
  it("returns no tokens for an empty line", () => {
    expect(tokenizeLine("")).toEqual([]);
  });

  it("tags a line comment as one token", () => {
    expect(tokenizeLine("// a note")).toEqual([
      { text: "// a note", kind: "comment" },
    ]);
  });

  it("tags a quoted string, leaving surrounding code plain", () => {
    expect(tokenizeLine('const x = "hi";')).toEqual([
      { text: "const", kind: "keyword" },
      { text: " x = ", kind: "plain" },
      { text: '"hi"', kind: "string" },
      { text: ";", kind: "plain" },
    ]);
  });

  it("tags a number literal", () => {
    expect(tokenizeLine("retries = 3")).toEqual([
      { text: "retries = ", kind: "plain" },
      { text: "3", kind: "number" },
    ]);
  });

  it("does not match a keyword substring inside a longer identifier", () => {
    expect(tokenizeLine("interfaceBuilder = 1")).toEqual([
      { text: "interfaceBuilder = ", kind: "plain" },
      { text: "1", kind: "number" },
    ]);
  });
});
