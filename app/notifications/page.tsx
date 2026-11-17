"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
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
    if (tab === "posts") return n.type === "COMMENT" || n.type === "REPLY" || n.type === "COMMENT_LIKE";
    return n.type === "LIKE" || n.type === "SHARE" || n.type === "FOLLOW";
  });

  return (
    <div className="mx-auto max-w-[620px] space-y-5">
      <div className="relative flex items-center justify-center py-1">
        <Link href="/" aria-label="Retour" className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-bord bg-carte shadow-[2px_2px_0_0_var(--color-encre)] transition-transform active:scale-[0.97] hover:bg-pilule">
          <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] border-bord bg-jaune shadow-[2px_2px_0_0_var(--color-encre)]">
            <Mail size={16} strokeWidth={2.25} aria-hidden="true" />
          </span>
          <h1 className="font-display text-[18px] uppercase tracking-tight text-encre sm:text-[20px]">Notifications</h1>
        </div>
      </div>
      {items.some((n) => !n.read) ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => markRead.mutate(items.map((n) => n.id))}
            className="text-[12px] font-medium text-muted underline underline-offset-2 hover:text-encre"
          >
            Tout marquer lu
          </button>
        </div>
      ) : null}
      <NotificationTabs active={tab} onChange={setTab} />
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-[16px] bg-pilule" />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <NotificationRow key={item.id} item={item} onRead={(id) => markRead.mutate([id])} />
          ))}
        </div>
      )}
    </div>
  );
}
