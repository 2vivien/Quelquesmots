"use client";

import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAuthors } from "../hooks/useAuthors";
import type { AuthorProfile } from "../types/authors.types";
import { AuthorRow } from "./AuthorRow";

/**
 * Vue interactive de l'annuaire des auteurs avec filtrage par nom (écran 7).
 * @param props Auteurs initiaux chargés côté serveur.
 */
export function AuthorsDirectoryView({ initialAuthors }: { initialAuthors: AuthorProfile[] }) {
  const [query, setQuery] = useState("");
  const { data: authors = [] } = useAuthors(query, query ? undefined : initialAuthors);
  return (
    <div className="space-y-6">
      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un auteur…" />
      {authors.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">{authors.map((a) => <AuthorRow key={a.userId} author={a} />)}</div>
      )}
    </div>
  );
}
