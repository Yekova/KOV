import { searchIndex, type SearchItem } from "@/data/searchIndex";

export type SearchCategory = SearchItem["category"] | "Tout";

// Fetched once per page load, not per keystroke. The promise itself is the
// cache: concurrent callers share it, and a failure resolves to an empty
// list rather than rejecting, so a search box never breaks because the
// journal is briefly unreachable.
let articlesPromise: Promise<SearchItem[]> | null = null;

function loadArticles(): Promise<SearchItem[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  articlesPromise ??= fetch("/api/search")
    .then((response) => (response.ok ? (response.json() as Promise<SearchItem[]>) : []))
    .catch(() => []);
  return articlesPromise;
}

// The one place the site's query logic lives — the component only calls this
// and renders whatever comes back. Async-shaped from the start on purpose,
// "so that swap doesn't change the call site's shape either", and this is
// the swap: the static array is still there for the pages, and the articles
// now come from the database, where they are actually written.
//
// Filtering stays in memory rather than moving to Postgres. Fifty-odd items
// is nothing to filter, and doing it client-side keeps the box instant with
// no request per character typed.
export async function searchKov(query: string, category: SearchCategory): Promise<SearchItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Articles are skipped entirely when a non-Journal category is selected,
  // so a filtered search does not wait on a request whose results it would
  // discard anyway.
  const articles = category === "Tout" || category === "Journal" ? await loadArticles() : [];

  return [...searchIndex, ...articles].filter((item) => {
    if (category !== "Tout" && item.category !== category) return false;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords?.some((keyword) => keyword.toLowerCase().includes(q))
    );
  });
}
