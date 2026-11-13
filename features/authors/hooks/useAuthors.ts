"use client";

import { useQuery } from "@tanstack/react-query";
import { authorsService } from "../services/authors.service";
import type { AuthorProfile } from "../types/authors.types";

/**
 * Hook de recherche et de chargement de l'annuaire des auteurs.
 * @param query Terme de filtrage optionnel.
 * @param initialData Données initiales fournies par le serveur.
 * @returns Liste d'auteurs et état de chargement.
 */
export function useAuthors(query?: string, initialData?: AuthorProfile[]) {
  return useQuery({
    queryKey: ["authors", "directory", query ?? ""],
    queryFn: () => authorsService.listDirectory(query),
    initialData,
  });
}

/**
 * Hook de chargement du profil public d'un auteur par pseudonyme.
 * @param username Pseudonyme de l'auteur.
 * @param initialData Données initiales éventuelles.
 * @returns Profil public ou `null`.
 */
export function useAuthorProfile(
  username: string,
  initialData?: AuthorProfile | null,
) {
  return useQuery({
    queryKey: ["authors", "profile", username],
    queryFn: () => authorsService.getByUsername(username),
    initialData,
  });
}
