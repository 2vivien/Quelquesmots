"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { searchService } from "../services/search.service";
import type { SearchTab } from "../types/search.types";

/**
 * Hook de recherche globale avec filtrage par onglet.
 * @param query Terme recherché.
 * @param tab Onglet actif.
 * @returns Résultats et état de chargement.
 */
export function useSearch(query: string, tab: SearchTab) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["search", query, tab, user?.id ?? "guest"],
    queryFn: () => searchService.search(query, tab, user?.id ?? null),
  });
}

/**
 * Hook de suggestions instantanées avec debounce de 250 ms.
 * @param query Texte saisi dans l'en-tête.
 * @returns Liste de 5 suggestions maximum.
 */
export function useSuggestions(query: string) {
  const { user } = useAuth();
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);
  return useQuery({
    queryKey: ["suggest", debounced, user?.id ?? "guest"],
    queryFn: () => searchService.suggest(debounced, user?.id ?? null),
    enabled: debounced.trim().length >= 2,
  });
}
