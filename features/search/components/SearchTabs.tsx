"use client";

import type { SearchTab } from "../types/search.types";

const TABS: Array<{ id: SearchTab; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "posts", label: "Publications" },
  { id: "themes", label: "Thèmes" },
  { id: "authors", label: "Auteurs" },
  { id: "tags", label: "Tags" },
];

interface SearchTabsProps {
  active: SearchTab;
  onChange: (tab: SearchTab) => void;
}

/**
 * Onglets de filtrage de la page de recherche globale (écran 2).
 * @param props Onglet actif et gestionnaire de changement.
 */
export function SearchTabs({ active, onChange }: SearchTabsProps) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-bord">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap border-b-2 pb-2.5 text-sm transition-colors ${
              isActive
                ? "border-encre font-medium text-encre"
                : "border-transparent text-muted hover:text-encre"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
