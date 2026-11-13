"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FeedSearchProps {
  placeholder?: string;
}

/**
 * Barre de recherche pleine largeur du Mur redirigeant vers `/recherche`.
 * @param props Texte d'indication facultatif.
 */
export function FeedSearch({
  placeholder = "Rechercher un mot, un thème, un auteur…",
}: FeedSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/recherche?q=${encodeURIComponent(trimmed)}` : "/recherche");
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search
        size={18}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-[44px] w-full rounded-full border border-transparent bg-pilule pl-11 pr-4 text-[15px] text-encre placeholder:text-muted focus:border-encre focus:outline-none"
      />
    </form>
  );
}
