// Pure, browser-only utilities (DOMParser) for turning an article's HTML
// body into a table of contents. Both functions only ever run client-side —
// injectHeadingIds() is called once the article mounts, before the sanitized
// HTML is handed to dangerouslySetInnerHTML.

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip combining accents (NFD splits e.g. "é" into "e" + a combining mark)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function injectHeadingIds(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const headings = doc.querySelectorAll("h2, h3");
  const usedIds = new Set<string>();

  headings.forEach((heading) => {
    if (heading.id) {
      usedIds.add(heading.id);
      return;
    }
    const base = `toc-${slugify(heading.textContent ?? "")}`;
    let id = base || "toc-section";
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    heading.id = id;
  });

  return doc.body.innerHTML;
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractTOC(html: string): TocItem[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const headings = Array.from(doc.querySelectorAll("h2, h3"));

  return headings
    .map((heading) => ({
      id: heading.id,
      text: (heading.textContent ?? "").trim(),
      level: (heading.tagName === "H3" ? 3 : 2) as 2 | 3,
    }))
    .filter((item) => item.text.length > 0);
}
