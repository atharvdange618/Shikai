import { describe, expect, it } from "vitest";

import { buildHtml } from "@/lib/markdown-html";

// The page's script reads a code block's language from its class with a regex
// literal. Pull that literal out of the HTML the WebView receives and run it.
function languageRegex(): RegExp {
  const match = /className\.match\(\/(.+?)\/\)/.exec(buildHtml("", false, 16));
  if (!match?.[1]) throw new Error("language regex not found in page script");
  return new RegExp(match[1]);
}

describe("buildHtml code block language", () => {
  it.each([
    ["language-typescript", "typescript"],
    ["language-python3", "python3"],
    ["language-c++", "c++"],
    ["language-objective_c", "objective_c"],
  ])("reads %s as %s", (className, lang) => {
    expect(languageRegex().exec(className)?.[1]).toBe(lang);
  });

  it("finds no language without a language- class", () => {
    expect(languageRegex().exec("hljs")).toBeNull();
  });
});
