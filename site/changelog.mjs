import { createHighlighter, escapeHtml } from "@tanstack/highlight/core";
import * as languages from "@tanstack/highlight/languages";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import { createThemeCss } from "@tanstack/highlight/theme";
import { githubLightTheme } from "@tanstack/highlight/themes/github-light";
import { headingCollectionExtension } from "@tanstack/markdown/extensions/headings";
import { renderHtml } from "@tanstack/markdown/html";
import { parseMarkdown } from "@tanstack/markdown/parser";

const repo = "https://github.com/atharvdange618/Shikai";
const highlighter = createTanStackMarkdownHighlighter(
  createHighlighter({ languages: Object.values(languages) }),
);
export const changelogCodeTheme = createThemeCss({
  light: githubLightTheme,
  lightSelector: ".changelog",
  codeBlockSelector: ".changelog pre.tm-code",
  lineNumbersSelector: ".changelog .tm-code--line-numbers",
});

/** @typedef {{ title: string, id: string, tag: string | null, notes: import("@tanstack/markdown").BlockNode[] }} Release */

/** @param {string} markdown */
export function renderChangelog(markdown) {
  const document = parseMarkdown(markdown, {
    extensions: [headingCollectionExtension()],
    urlTransform(rawUrl, _kind, screenedUrl) {
      if (!screenedUrl) return null;
      if (rawUrl.startsWith("#")) return screenedUrl;
      return URL.parse(screenedUrl, `${repo}/blob/main/`)?.href ?? null;
    },
  });
  const titles = new Map(document.headings?.map(({ id, text }) => [id, text]));
  /** @type {Release[]} */
  const entries = [];
  for (const block of document.children) {
    if (block.type !== "heading" || block.depth !== 2) {
      if (block.type !== "thematicBreak") entries.at(-1)?.notes.push(block);
      continue;
    }
    const title = titles.get(block.id ?? "");
    if (!title) throw new Error("A Shikai changelog section is missing its title.");
    const name = title.replace(/ \([^)]*\)$/, "");
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const tag = /^v\d+\.\d+\.\d+$/.test(name) ? name : null;
    entries.push({ title, id, tag, notes: [] });
  }

  const latest = entries.find((entry) => entry.tag);
  if (!latest || new Set(entries.map(({ id }) => id)).size !== entries.length) {
    throw new Error("The Shikai changelog needs a tagged release and unique section headings.");
  }

  const featured = [
    latest,
    ...entries.slice(0, entries.indexOf(latest)).filter(({ id }) => id !== "unreleased"),
  ];
  const unreleased = entries.find(({ id }) => id === "unreleased");
  if (unreleased) featured.push(unreleased);
  const history = entries.filter((entry) => !featured.includes(entry));

  /** @param {Release} entry @param {"h2" | "h3"} heading */
  function article(entry, heading) {
    const links =
      entry === latest
        ? `<div class="release-links">
          <a class="button" href="https://play.google.com/store/apps/details?id=com.atharvdange618.Shikai">Get Shikai on Google Play</a>
          <a class="text-link" href="${repo}/releases/tag/${entry.tag}">View GitHub release</a>
        </div>`
        : "";
    const title = entry.id === "unreleased" ? "In development" : escapeHtml(entry.title);
    /** @type {Release["notes"]} */
    const children = entry.notes.map((block) =>
      heading === "h3" && block.type === "heading" && block.depth === 3
        ? { ...block, depth: 4 }
        : block,
    );
    const notes = renderHtml({ type: "root", children }, { highlighter });
    return `<section class="release${entry === latest ? " release-latest" : ""}" id="${entry.id}">
      <${heading}><a href="#${entry.id}">${entry === latest ? "Latest tagged release · " : ""}${title}</a></${heading}>
      ${links}${notes}
    </section>`;
  }

  const contents = featured
    .map(
      ({ id, title }) =>
        `<li><a href="#${id}">${id === "unreleased" ? "In development" : escapeHtml(title)}</a></li>`,
    )
    .join("");
  const archive = history.length
    ? `<section class="release-history" id="release-history"><h2>Release history</h2>${history.map((entry) => article(entry, "h3")).join("")}</section>`
    : "";

  return {
    contents: contents + (archive ? '<li><a href="#release-history">Release history</a></li>' : ""),
    body: featured.map((entry) => article(entry, "h2")).join("") + archive,
  };
}
