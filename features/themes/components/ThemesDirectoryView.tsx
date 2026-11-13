"use client";

import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useThemes } from "../hooks/useThemes";
import type { ThemeItem } from "../types/themes.types";
import { ThemeGrid } from "./ThemeGrid";

/**
 * Vue interactive du répertoire des thèmes avec champ de recherche (écran 4).
 * @param props Thèmes initiaux chargés côté serveur.
 */
export function ThemesDirectoryView({ initialThemes }: { initialThemes: ThemeItem[] }) {
  const [query, setQuery] = useState("");
  const { data: themes = [] } = useThemes(query, query ? undefined : initialThemes);
  return (
    <div className="space-y-6">
      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un thème…" />
      <ThemeGrid themes={themes} />
    </div>
  );
}
