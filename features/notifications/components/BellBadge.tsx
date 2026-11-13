"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

/**
 * Bouton cloche avec compteur numérique discret pour l'en-tête connecté.
 */
export function BellBadge() {
  const { unreadCount } = useNotifications();
  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} non lues)` : "Notifications"}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-encre transition-colors hover:bg-pilule"
    >
      <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-encre-fort px-1 text-[10px] font-medium tabular-nums text-ivoire">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
