"use client";

import type { NotificationTab } from "../types/notifications.types";

const TABS: Array<{ id: NotificationTab; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "posts", label: "Textes" },
  { id: "mentions", label: "Mentions" },
  { id: "interactions", label: "Interactions" },
];

interface NotificationTabsProps {
  active: NotificationTab;
  onChange: (tab: NotificationTab) => void;
}

/**
 * Onglets de filtrage en pastilles (maquette notifications).
 * La logique de filtrage reste dans la page, ce composant ne gère que la sélection.
 */
export function NotificationTabs({ active, onChange }: NotificationTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrer les notifications">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-h-[36px] whitespace-nowrap rounded-full border-[1.5px] px-4 text-[13px] font-bold transition-transform active:scale-[0.97] ${
            active === tab.id
              ? "border-bord bg-encre text-ivoire shadow-[2px_2px_0_0_var(--color-jaune)]"
              : "border-bord bg-carte text-encre hover:bg-pilule"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}