"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Champ de saisie pilule pour les écrans de recherche et répertoires.
 * @param props Valeur courante, callback de saisie et texte indicatif.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher un mot, un thème, un auteur…",
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={18}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-[44px] w-full rounded-full border border-transparent bg-pilule pl-11 pr-4 text-[15px] text-encre placeholder:text-muted focus:border-encre focus:outline-none"
      />
    </div>
  );
}
