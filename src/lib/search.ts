import { searchIndex, type SearchItem } from "@/data/searchIndex";

export type SearchCategory = SearchItem["category"] | "Tout";

// The one place GlobalSearch's actual query logic lives — the component
// only calls this and renders whatever comes back. Today it's a static
// array filter; swapping in a real backend/full-text search later (per the
// brief's §15 "prévoir une architecture permettant plus tard de connecter
// une vraie recherche globale") means changing this function's body, not
// touching GlobalSearch.tsx at all. Async-shaped on purpose, even though
// the current implementation is synchronous, so that swap doesn't change
// the call site's shape either.
export async function searchKov(query: string, category: SearchCategory): Promise<SearchItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return searchIndex.filter((item) => {
    if (category !== "Tout" && item.category !== category) return false;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords?.some((keyword) => keyword.toLowerCase().includes(q))
    );
  });
}
