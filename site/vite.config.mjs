import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, normalizePath } from "vite";

import { changelogCodeTheme, renderChangelog } from "./changelog.mjs";
import { readPolicy } from "./policies.mjs";

const path = (name) => fileURLToPath(new URL(name, import.meta.url));
const changelogPage = path("./changelog/index.html");
const entries = [
  path("./index.html"),
  path("./privacy/index.html"),
  path("./delete-data/index.html"),
  path("./terms/index.html"),
  changelogPage,
];
const policies = new Map([
  [normalizePath(entries[1]), path("../docs/index.html")],
  [normalizePath(entries[2]), path("../docs/delete-data.html")],
]);

const header = `<a class="skip-link" href="#main">Skip to content</a>
<header class="wrap site-header">
  <a class="brand" href="/"><img src="/assets/icon.png" width="36" height="36" alt="" />Shikai</a>
  <nav aria-label="Main navigation">
    <a href="/#tour">Product tour</a>
    <a href="/changelog/">Changelog</a>
    <a href="https://github.com/atharvdange618/Shikai">GitHub</a>
  </nav>
</header>`;

const footer = `<footer class="wrap site-footer">
  <a class="brand" href="/"><img src="/assets/icon.png" width="32" height="32" alt="" />Shikai</a>
  <nav aria-label="Footer navigation">
    <a href="/privacy/">Privacy Policy</a>
    <a href="/delete-data/">Delete Data</a>
    <a href="/terms/">Terms of Service</a>
    <a href="https://x.com/atharvdangedev">Atharv Dange</a>
  </nav>
</footer>`;

export default defineConfig({
  appType: "mpa",
  build: { rolldownOptions: { input: entries } },
  plugins: [
    {
      name: "shikai-site-html",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          const page = html
            .replace("<!-- site-header -->", () => header)
            .replace("<!-- site-footer -->", () => footer);
          const filename = normalizePath(context.filename);
          if (filename === normalizePath(changelogPage)) {
            const { contents, body } = renderChangelog(readFileSync(path("../CHANGES.md"), "utf8"));
            return {
              html: page
                .replace("<!-- changelog-contents -->", () => contents)
                .replace("<!-- changelog-body -->", () => body),
              tags: [{ tag: "style", children: changelogCodeTheme, injectTo: "head" }],
            };
          }

          const source = policies.get(filename);
          if (!source) return page;

          const { title, updated, body, sections } = readPolicy(readFileSync(source, "utf8"));
          const contents = sections
            .map(({ id, label }) => `<li><a href="#${id}">${label}</a></li>`)
            .join("");
          return page
            .replace("<!-- policy-contents -->", () => contents)
            .replace(
              "<!-- policy-title -->",
              () => `<header class="policy-heading"><h1>${title}</h1>${updated}</header>`,
            )
            .replace("<!-- policy-body -->", () => body);
        },
      },
    },
  ],
});
