"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  NotificationRow,
  NotificationTabs,
  type NotificationTab,
  useNotifications,
} from "@/features/notifications";

/** Page des notifications regroupées (écran 10). */
export default function NotificationsPage() {
  const { items, isLoading, markRead } = useNotifications();
  const [tab, setTab] = useState<NotificationTab>("all");

  const filtered = items.filter((n) => {
    if (tab === "all") return true;
    if (tab === "mentions") return n.type === "MENTION";
    if (tab === "posts") return n.type === "COMMENT" || n.type === "REPLY";
    return n.type === "LIKE" || n.type === "SHARE";
  });

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Retour" className="text-encre hover:opacity-70">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <h1 className="font-serif text-3xl text-encre">Notifications</h1>
        </div>
        {items.some((n) => !n.read) ? (
          <button
            type="button"
            onClick={() => markRead.mutate(items.map((n) => n.id))}
            className="text-sm text-muted hover:text-encre hover:underline"
          >
            Tout marquer lu
          </button>
        ) : null}
      </div>
      <NotificationTabs active={tab} onChange={setTab} />
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-[16px] bg-pilule" />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div>
          {filtered.map((item) => (
            <NotificationRow key={item.id} item={item} onRead={(id) => markRead.mutate([id])} />
          ))}
        </div>
      )}
    </div>
  );
}
