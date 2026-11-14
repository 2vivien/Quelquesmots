import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { SearchResponse, SearchResultItem, SearchService, SearchTab } from "../types/search.types";

/** Implémentation réelle du service de recherche via API. */
export const searchReal: SearchService = {
  async search(query: string, tab: SearchTab): Promise<SearchResponse> {
    const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}&tab=${tab}`));
    if (!res.ok) throw new Error(await apiErrorMessage(res, "La recherche est temporairement indisponible."));
    return (await res.json()) as SearchResponse;
  },
  async suggest(query: string): Promise<SearchResultItem[]> {
    if (query.trim().length < 2) return [];
    const res = await fetch(apiUrl(`/api/search/suggest?q=${encodeURIComponent(query)}`));
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Les suggestions sont temporairement indisponibles."));
    const data = (await res.json()) as { items: SearchResultItem[] };
    return data.items;
  },
};
