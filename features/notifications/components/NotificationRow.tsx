"use client";

import Link from "next/link";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AuthorAvatar } from "@/features/authors";
import type { NotificationItem, NotificationKind } from "../types/notifications.types";

const ACTION_TEXT: Record<NotificationKind, string> = {
  LIKE: "a aimé votre texte",
  COMMENT: "a commenté",
  REPLY: "a répondu à votre commentaire",
  SHARE: "a partagé votre texte",
  MENTION: "vous a mentionné",
  MODERATION: "décision de modération sur votre texte",
};

interface NotificationRowProps {
  item: NotificationItem;
  onRead: (id: string) => void;
}

/**
 * Ligne d'une notification cliquable ouvrant le texte associé.
 * @param props Notification et callback de marquage comme lu.
 */
export function NotificationRow({ item, onRead }: NotificationRowProps) {
  return (
    <Link
      href={item.postSlug ? `/mots/${item.postSlug}` : "/notifications"}
      onClick={() => onRead(item.id)}
      className={`flex items-center gap-3.5 border-b border-bord py-4 transition-colors hover:bg-carte/70 ${item.read ? "opacity-75" : ""}`}
    >
      <AuthorAvatar src={item.actorAvatarUrl} alt={item.actorUsername} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-encre">
          <span className="font-medium">{item.actorUsername}</span> {ACTION_TEXT[item.type]}
        </p>
        <p className="text-[13px] text-muted"><RelativeTime isoDate={item.createdAt} /></p>
      </div>
      {!item.read ? <span className="text-xs font-medium text-encre">Nouveau</span> : null}
    </Link>
  );
}
