/** @param {string} source */
export function readPolicy(source) {
  const title = /<h1>([^<]+)<\/h1>/.exec(source)?.[1];
  const [, updated, content] =
    /(<p class="updated">[^<]+<\/p>)\s+([\s\S]+?)\s*<div class="footer">/.exec(source) ?? [];
  if (!title || !updated || !content) {
    throw new Error("The published Shikai policy is missing its title or body.");
  }

  const sections = Array.from(content.matchAll(/<h2>([^<]+)<\/h2>/g), ([, label]) => {
    const id = label
      .toLowerCase()
      .replaceAll("'", "")
      .replace(/[^a-z0-9]+/g, "-");
    return { id, label };
  });
  if (sections.length === 0 || new Set(sections.map(({ id }) => id)).size !== sections.length) {
    throw new Error("The published Shikai policy must have unique section headings.");
  }

  let body = content.replace('href="index.html"', 'href="/privacy/"');
  for (const { id, label } of sections) {
    body = body.replace(`<h2>${label}</h2>`, `<h2 id="${id}">${label}</h2>`);
  }

  return { title, updated, body, sections };
}
