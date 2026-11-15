"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** Barre de recherche façon Trugly : épaisse, bordurée, centrée. */
export function HeaderSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/recherche?q=${encodeURIComponent(trimmed)}` : "/recherche");
  };
  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <Search size={16} strokeWidth={2.5} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-encre" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher…"
        aria-label="Rechercher"
        className="h-10 w-full rounded-full border-2 border-encre bg-carte pl-11 pr-4 text-[14px] font-medium text-encre placeholder:font-normal placeholder:text-muted shadow-[2px_2px_0_0_var(--color-ink-jar)] transition focus:outline-none focus:shadow-[3px_3px_0_0_var(--color-ink-jar)] sm:h-11 sm:pl-12 sm:text-[15px]"
      />
    </form>
  );
}
