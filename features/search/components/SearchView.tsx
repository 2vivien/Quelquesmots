"use client";

import { useState } from "react";
import { formatCount } from "@/lib/format";
import { useSearch } from "../hooks/useSearch";
import type { SearchTab } from "../types/search.types";
import { SearchBar } from "./SearchBar";
import { SearchResultRow } from "./SearchResultRow";
import { SearchTabs } from "./SearchTabs";

/**
 * Vue interactive de la page de recherche globale (écran 2).
 * @param props Requête initiale issue des paramètres d'URL.
 */
export function SearchView({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<SearchTab>("all");
  const { data, isLoading } = useSearch(query, tab);
  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      <SearchBar value={query} onChange={setQuery} />
      <SearchTabs active={tab} onChange={setTab} />
      {query.trim() ? (
        <p className="text-sm text-muted">
          <span className="font-medium text-encre">#{query.trim()}</span> — {formatCount(data?.total ?? 0)} résultats
        </p>
      ) : null}
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-[16px] bg-pilule" />
      ) : items.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div>{items.map((item) => <SearchResultRow key={`${item.kind}-${item.id}`} item={item} />)}</div>
      )}
    </div>
  );
}
