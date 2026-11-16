"use client";

import Link from "next/link";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AuthorAvatar } from "@/features/authors";
import type { NotificationItem, NotificationKind } from "../types/notifications.types";

const ACTION_TEXT: Record<NotificationKind, string> = {
  LIKE: "a aimé votre texte",
  COMMENT: "a commenté",
  COMMENT_LIKE: "a aimé votre commentaire",
  REPLY: "a répondu à votre commentaire",
  FOLLOW: "a commencé à vous suivre",
  SHARE: "a partagé votre texte",
  MENTION: "vous a mentionné",
  MODERATION: "décision de modération sur votre texte",
};

interface NotificationRowProps {
  item: NotificationItem;
  onRead: (id: string) => void;
}

/**
 * Ligne d'une notification cliquable ouvrant le texte associé, et le commentaire
 * ciblé lorsqu'il existe (ancre #comment-{id}) — ≤ 50 lignes.
 */
export function NotificationRow({ item, onRead }: NotificationRowProps) {
  const href = item.postId
    ? `/mots/${item.postId}${item.commentId ? `#comment-${item.commentId}` : ""}`
    : "/notifications";
  const extraActors = item.type === "LIKE" ? Math.max(0, item.actorIds.length - 1) : 0;
  const actionText = extraActors === 0
    ? ACTION_TEXT[item.type]
    : extraActors === 1
      ? "et 1 autre personne a aimé votre texte"
      : `et ${extraActors} autres personnes ont aimé votre texte`;
  return (
    <Link
      href={href}
      onClick={() => onRead(item.id)}
      className={`flex items-center gap-3.5 border-b border-bord py-4 transition-colors hover:bg-carte/70 ${item.read ? "opacity-75" : ""}`}
    >
      <AuthorAvatar src={item.actorAvatarUrl} alt={item.actorUsername} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-encre">
          <span className="font-medium">{item.actorUsername}</span> {actionText}
        </p>
        <p className="text-[13px] text-muted"><RelativeTime isoDate={item.createdAt} /></p>
      </div>
      {!item.read ? <span className="text-xs font-medium text-encre">Nouveau</span> : null}
    </Link>
  );
}
