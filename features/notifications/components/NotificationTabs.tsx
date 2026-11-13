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
 * Onglets de filtrage de l'écran Notifications (écran 10).
 * @param props Onglet actif et gestionnaire de sélection.
 */
export function NotificationTabs({ active, onChange }: NotificationTabsProps) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-bord">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap border-b-2 pb-2.5 text-sm ${
            active === t.id
              ? "border-encre font-medium text-encre"
              : "border-transparent text-muted hover:text-encre"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
