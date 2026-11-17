"use client";

import Link from "next/link";
import { Heart, MessageCircle, UserPlus, AtSign, Shield, Share2 } from "lucide-react";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AuthorAvatar } from "@/features/authors";
import { useFollow } from "@/features/interactions";
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

const ICONS: Record<NotificationKind, typeof Heart> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  COMMENT_LIKE: Heart,
  REPLY: MessageCircle,
  FOLLOW: UserPlus,
  SHARE: Share2,
  MENTION: AtSign,
  MODERATION: Shield,
};

interface NotificationRowProps {
  item: NotificationItem;
  onRead: (id: string) => void;
}

/** Ligne de notification en carte, avec action « Suivre en retour » pour les abonnements. */
export function NotificationRow({ item, onRead }: NotificationRowProps) {
  const href = item.postId
    ? `/mots/${item.postId}${item.commentId ? `#comment-${item.commentId}` : ""}`
    : "/notifications";
  const extraActors = item.type === "LIKE" ? Math.max(0, item.actorIds.length - 1) : 0;
  const actionText = extraActors === 0
    ? ACTION_TEXT[item.type]
    : extraActors === 1
      ? "et 1 autre personne ont aimé votre texte"
      : `et ${extraActors} autres personnes ont aimé votre texte`;
  const Icon = ICONS[item.type];
  const actorId = item.actorIds[0];

  return (
    <div className={`carte flex items-center gap-3 p-3.5 transition-transform active:scale-[0.995] sm:p-4 ${item.read ? "opacity-80" : ""}`}>
      <div className="relative shrink-0">
        <AuthorAvatar src={item.actorAvatarUrl} alt={item.actorUsername} size={44} />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-bord bg-rose-p text-encre">
          <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </div>
      <Link href={href} onClick={() => onRead(item.id)} className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[14px] leading-snug text-encre sm:text-[15px]">
          <span className="font-extrabold">{item.actorUsername}</span>{" "}
          <span className="font-medium">{actionText}</span>
        </p>
        {item.postTitle ? (
          <p className="truncate text-[13px] font-medium text-muted">« {item.postTitle} »</p>
        ) : null}
        <p className="text-[12px] text-muted"><RelativeTime isoDate={item.createdAt} /></p>
      </Link>
      {item.type === "FOLLOW" && actorId ? (
        <FollowBack targetUserId={actorId} />
      ) : !item.read ? (
        <span className="shrink-0 rounded-full border-[1.5px] border-bord bg-jaune px-2.5 py-1 text-[11px] font-extrabold text-encre">Nouveau</span>
      ) : null}
    </div>
  );
}

/** Bouton « Suivre en retour » branché sur le même hook que le bouton Suivre du profil. */
function FollowBack({ targetUserId }: { targetUserId: string }) {
  const { following, isSelf, toggle, pending } = useFollow(targetUserId);
  if (isSelf) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || following}
      aria-pressed={following}
      className="shrink-0 rounded-full border-[1.5px] border-bord bg-[#7C5CFF] px-3 py-1.5 text-[12px] font-bold text-white shadow-[2px_2px_0_0_var(--color-encre)] transition-transform active:scale-[0.97] disabled:opacity-60"
    >
      {following ? "Suivi" : "Suivre en retour"}
    </button>
  );
}