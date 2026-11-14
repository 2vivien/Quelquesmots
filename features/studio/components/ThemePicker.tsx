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
  const toggle = (id: string) => {
    if (selected.includes(id)) { onChange(selected.filter((s) => s !== id)); return; }
    if (selected.length < 5) onChange([...selected, id]);
  };

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`font-semibold ${selected.length === 0 ? "text-encre" : "text-muted"}`}>
          Thèmes (1 à 5 obligatoires) · {selected.length}/5
        </span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer parmi les 55 thèmes…" className="rounded-full border-[1.5px] border-bord bg-carte px-3 py-1 text-xs font-medium text-encre placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jaune" />
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <button key={id} type="button" onClick={() => toggle(id)} className="rounded-full border-[1.5px] border-bord bg-jaune px-3 py-1 font-bold text-encre shadow-[2px_2px_0_0_var(--color-encre)]">
              {themes.find((t) => t.id === id)?.name ?? id} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
        {filtered.map((t) => {
          const active = selected.includes(t.id);
          return (
            <button key={t.id} type="button" disabled={!active && selected.length >= 5} onClick={() => toggle(t.id)} className={`rounded-full border-[1.5px] border-bord px-3 py-1 font-semibold transition-all disabled:opacity-40 ${active ? "bg-jaune text-encre shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte text-encre hover:bg-pilule"}`}>
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
