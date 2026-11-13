"use client";

import { useQuery } from "@tanstack/react-query";
import { themesService } from "../services/themes.service";
import type { ThemeItem } from "../types/themes.types";

/**
 * Hook de chargement et filtrage des thèmes actifs.
 * @param query Terme de recherche facultatif.
 * @param initialData Thèmes préchargés côté serveur.
 * @returns Liste des thèmes actifs.
 */
export function useThemes(query?: string, initialData?: ThemeItem[]) {
  return useQuery({
    queryKey: ["themes", query ?? ""],
    queryFn: () => themesService.listActive(query),
    initialData,
  });
}
