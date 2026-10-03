import { describe, expect, it } from "vitest";

import { resolveMarkdownLink } from "@/lib/markdown-links";

const CTX = "octocat/hello";
const BLOB = "https://github.com/octocat/hello/blob/HEAD";

describe("resolveMarkdownLink", () => {
  it("resolves a relative link against the root README", () => {
    expect(resolveMarkdownLink("docs/GUIDE.md", CTX, "README.md")).toBe(
      `${BLOB}/docs/GUIDE.md`,
    );
  });

  it("resolves a relative link against the file's own folder", () => {
    expect(resolveMarkdownLink("setup.md", CTX, "docs/GUIDE.md")).toBe(
      `${BLOB}/docs/setup.md`,
    );
  });

  it("handles ./ and ../ segments", () => {
    expect(
      resolveMarkdownLink("../CONTRIBUTING.md", CTX, "docs/a/GUIDE.md"),
    ).toBe(`${BLOB}/docs/CONTRIBUTING.md`);
    expect(resolveMarkdownLink("./x.md", CTX, "docs/GUIDE.md")).toBe(
      `${BLOB}/docs/x.md`,
    );
  });

  it("resolves a root-relative link from the repo root", () => {
    expect(resolveMarkdownLink("/MAINTENANCE.md", CTX, "docs/GUIDE.md")).toBe(
      `${BLOB}/MAINTENANCE.md`,
    );
  });

  it("keeps the fragment so line links survive", () => {
    expect(resolveMarkdownLink("src/app.ts#L10", CTX, "README.md")).toBe(
      `${BLOB}/src/app.ts#L10`,
    );
  });

  it("uses tree for a link to a folder", () => {
    expect(resolveMarkdownLink("docs/", CTX, "README.md")).toBe(
      "https://github.com/octocat/hello/tree/HEAD/docs",
    );
  });

  it("resolves from the repo root when there is no file path", () => {
    expect(resolveMarkdownLink("docs/GUIDE.md", CTX)).toBe(
      `${BLOB}/docs/GUIDE.md`,
    );
  });

  it("passes absolute http(s) and mailto links through", () => {
    expect(resolveMarkdownLink("https://example.com/a", CTX)).toBe(
      "https://example.com/a",
    );
    expect(resolveMarkdownLink("mailto:a@b.co", CTX)).toBe("mailto:a@b.co");
  });

  it("rejects other schemes", () => {
    expect(resolveMarkdownLink("javascript:alert(1)", CTX)).toBeNull();
    expect(resolveMarkdownLink("intent://x", CTX)).toBeNull();
  });

  it("returns null for a relative link with no repo context", () => {
    expect(resolveMarkdownLink("docs/GUIDE.md")).toBeNull();
  });
});
