"use client";

import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import type { ThemeItem } from "@/features/themes";

const INITIAL_VISIBLE = 6;

/** Barre de filtres par thème avec compteur +N dépliable et lien vers /themes. */
export function FeedChips({ activeTheme, themes, onSelectTheme }: { activeTheme: string; themes: ThemeItem[]; onSelectTheme: (slug: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? themes : themes.slice(0, INITIAL_VISIBLE);
  const remaining = Math.max(0, themes.length - INITIAL_VISIBLE);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onSelectTheme("")} className={activeTheme === "" ? "puce-active" : "puce"}>
          Tout
        </button>
        {visible.map((t) => (
          <button key={t.slug} type="button" onClick={() => onSelectTheme(t.slug)} className={activeTheme === t.slug ? "puce-active" : "puce"}>
            {t.name}
          </button>
        ))}
        {remaining > 0 ? (
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="inline-flex min-h-[34px] items-center gap-1 whitespace-nowrap rounded-full border border-bord bg-carte px-3.5 py-1 text-sm font-medium tabular-nums text-encre hover:bg-pilule">
            {expanded ? <Minus size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
            <span>{expanded ? "Réduire" : remaining}</span>
          </button>
        ) : null}
        <Link href="/themes" className="ml-auto whitespace-nowrap text-[13px] text-muted hover:text-encre hover:underline">
          Page thèmes ({themes.length}) →
        </Link>
      </div>
    </div>
  );
}
