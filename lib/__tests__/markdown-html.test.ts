import { describe, expect, it } from "vitest";

import { buildHtml } from "@/lib/markdown-html";

interface FakeCode {
  className: string;
}
interface FakePre {
  getAttribute: (name: string) => string | null;
}
type RawLang = (code: FakeCode | null, pre: FakePre) => string;

// The page's script reads a raw <pre> block's language in one statement. Pull
// that statement out of the HTML the WebView receives and run it on fake nodes.
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
