"use client";

import { useQuery } from "@tanstack/react-query";
import { tagsService } from "../services/tags.service";

/**
 * Hook de chargement des tags approuvés (triés par usage).
 * @returns Liste des tags approuvés (vide pendant le chargement).
 */
export function usePopularTags() {
  return useQuery({
    queryKey: ["tags", "popular"],
    queryFn: () => tagsService.listPopular(),
    staleTime: 60_000,
  });
}
