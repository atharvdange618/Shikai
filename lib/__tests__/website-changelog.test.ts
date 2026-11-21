import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { renderChangelog } from "../../site/changelog.mjs";

describe("website changelog", () => {
  const sample = `# Changelog

## Unreleased

Work on main.

## v2.0.0 OTA update (November 11, 2026)

Production Android update.

## v2.0.0 (November 7, 2026)

### Features

- **Preview** uses \`inline code\`. [Commit](https://github.com/example/repo/commit/abcdef)
- [Decision](notes/DECISIONS.md#test) · [Unsafe](javascript:alert)

## v1.0.0

Initial release with <em>literal text</em>.
`;

  it("leads with the tagged release and keeps OTA and upcoming work distinct", () => {
    const { body, contents } = renderChangelog(sample.replaceAll("\n", "\r\n"));
    expect(body).toContain("Latest tagged release · v2.0.0 (November 7, 2026)");
    expect(body).toContain('href="https://github.com/atharvdange618/Shikai/releases/tag/v2.0.0"');
    expect(body.indexOf('id="v2-0-0"')).toBeLessThan(body.indexOf('id="v2-0-0-ota-update"'));
    expect(body.indexOf('id="unreleased"')).toBeLessThan(body.indexOf('id="release-history"'));
    expect(contents).toContain('href="#unreleased">In development');
    expect(contents).toContain('href="#release-history"');
    expect(body).toContain('<h3><a href="#v1-0-0">v1.0.0</a></h3>');
  });

  it("renders release formatting and preserves repo links without inserting raw HTML", () => {
    const { body } = renderChangelog(sample);
    expect(body).toContain("<strong>Preview</strong> uses <code>inline code</code>");
    expect(body).toContain("https://github.com/example/repo/commit/abcdef");
    expect(body).toContain(
      "https://github.com/atharvdange618/Shikai/blob/main/notes/DECISIONS.md#test",
    );
    expect(body).toContain("&lt;em&gt;literal text&lt;/em&gt;");
    expect(body).not.toContain("javascript:");
  });

  it("uses TanStack Highlight for code fences and keeps headings inside code", () => {
    const markdown = [
      "## v2.0.0",
      "",
      "```ts",
      "const release = true;",
      "/*",
      "## This text is part of the example",
      "*/",
      "```",
    ].join("\n");
    const { body } = renderChangelog(markdown);
    expect(body).toContain('class="th-token th-keyword">const</span>');
    expect(body).toContain("## This text is part of the example");
    expect(body).not.toContain('id="this-text-is-part-of-the-example"');
  });

  it("includes every entry in the real changelog with unique, working jump links", () => {
    const source = readFileSync(new URL("../../CHANGES.md", import.meta.url), "utf8");
    const { body, contents } = renderChangelog(source);
    expect(body.match(/class="release(?: release-latest)?"/g)).toHaveLength(
      Array.from(source.matchAll(/^## /gm)).length,
    );
    for (const [, id] of contents.matchAll(/href="#([^"]+)"/g)) {
      expect(body.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
  });
});
