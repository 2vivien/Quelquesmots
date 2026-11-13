"use client";

import { useState } from "react";
import { useThemes } from "@/features/themes";
import { normalizeSearchText } from "@/lib/format";

/** Sélecteur obligatoire de 1 à 5 thèmes parmi les 55 thèmes du catalogue. */
export function ThemePicker({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const { data: themes = [] } = useThemes();
  const [query, setQuery] = useState("");
  const needle = normalizeSearchText(query);
  const filtered = needle ? themes.filter((t) => normalizeSearchText(t.name).includes(needle)) : themes;
  const toggle = (slug: string) => {
    if (selected.includes(slug)) { onChange(selected.filter((s) => s !== slug)); return; }
    if (selected.length < 5) onChange([...selected, slug]);
  };

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={selected.length === 0 ? "font-medium text-accent" : "text-muted"}>
          Thèmes (1 à 5 obligatoires) · {selected.length}/5
        </span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer parmi les 55 thèmes…" className="rounded-full bg-pilule px-3 py-1 text-xs text-encre placeholder:text-muted focus:outline-none" />
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((slug) => (
            <button key={slug} type="button" onClick={() => toggle(slug)} className="rounded-full border border-encre-fort bg-encre-fort px-3 py-1 text-ivoire">
              {themes.find((t) => t.slug === slug)?.name ?? slug} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
        {filtered.map((t) => {
          const active = selected.includes(t.slug);
          return (
            <button key={t.slug} type="button" disabled={!active && selected.length >= 5} onClick={() => toggle(t.slug)} className={`rounded-full px-3 py-1 transition-colors ${active ? "bg-encre-fort text-ivoire" : "bg-pilule text-encre hover:bg-bord disabled:opacity-40"}`}>
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
