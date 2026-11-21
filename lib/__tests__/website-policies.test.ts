import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { readPolicy } from "../../site/policies.mjs";

describe("website policies", () => {
  it.each(["index.html", "delete-data.html"])("preserves the published text in %s", (file) => {
    const source = readFileSync(new URL(`../../docs/${file}`, import.meta.url), "utf8");
    const { title, updated, body, sections } = readPolicy(source);
    const original = source
      .slice(source.indexOf('<p class="updated">'), source.indexOf('<div class="footer">'))
      .trim();

    expect(source).toContain(`<h1>${title}</h1>`);
    expect(original.startsWith(updated)).toBe(true);
    expect(body.replace(/ id="[^"]+"/g, "").replace('href="/privacy/"', 'href="index.html"')).toBe(
      original.slice(updated.length).trimStart(),
    );
    for (const { id, label } of sections) {
      expect(body).toContain(`<h2 id="${id}">${label}</h2>`);
    }
    if (file === "delete-data.html") expect(body).toContain('href="/privacy/"');
  });

  it("fails the build when the source markers disappear", () => {
    expect(() => readPolicy("<h1>Privacy Policy</h1>")).toThrow(/missing its title or body/);
  });

  it("preserves the terms wording, update date, and contact link", () => {
    const source = readFileSync(
      new URL("../../store/terms-of-service.md", import.meta.url),
      "utf8",
    );
    const page = readFileSync(new URL("../../site/terms/index.html", import.meta.url), "utf8");
    const body = /<article class="policy-body">([\s\S]+)<\/article>/.exec(page)?.[1] ?? "";
    const date = /^\*\*Last updated:\*\* (.+)$/m.exec(source)?.[1];
    const contact = /\[@atharvdangedev\]\((https:\/\/[^)]+)\)/.exec(source)?.[1];
    const wording = source
      .replace(/^# .+\r?\n/, "")
      .replace(/^\*\*Last updated:\*\* .+\r?\n/m, "")
      .replace(/^(?:## |- )/gm, "")
      .replaceAll("**", "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    expect(
      body
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    ).toBe(wording.replace(/\s+/g, " ").trim());
    expect(date).toBeDefined();
    expect(contact).toBeDefined();
    expect(page).toContain(`Last updated: ${date}</p>`);
    expect(body).toContain(`href="${contact}">@atharvdangedev</a>`);
  });
});
