/** Onglet de filtrage de la recherche globale. */
export type SearchTab = "all" | "posts" | "themes" | "authors" | "tags";

/** Élément unifié de résultat ou suggestion de recherche. */
export interface SearchResultItem {
  id: string;
  kind: "post" | "theme" | "author" | "tag";
  title: string;
  subtitle: string;
  href: string;
  imageUrl?: string;
}

/** Résultats groupés de la recherche globale. */
export interface SearchResponse {
  total: number;
  items: SearchResultItem[];
}

/** Contrat du service de recherche. */
export interface SearchService {
  search(query: string, tab: SearchTab, viewerId?: string | null): Promise<SearchResponse>;
  suggest(query: string, viewerId?: string | null): Promise<SearchResultItem[]>;
}
