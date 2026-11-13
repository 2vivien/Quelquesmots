"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/**
 * Champ de recherche pilule réutilisable sans dépendance croisée entre features.
 * @param props Valeur, callback de saisie et texte indicatif.
 */
export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative">
      <Search size={18} strokeWidth={1.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
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
