"use client";

import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AuthorAvatar } from "@/features/authors";
import type { CommentItemData } from "../types/comments.types";
import { useAuth } from "@/features/auth";
import { openAuthPopup } from "@/lib/open-auth";

interface CommentItemProps {
  comment: CommentItemData;
  canHide: boolean;
  isReply?: boolean;
  onReply?: (rootId: string) => void;
  onLike: (commentId: string) => void;
  onHide: (id: string) => void;
}

/**
 * Affiche un commentaire ou une réponse dans la discussion d'un texte.
 * @param props Données du commentaire et actions de like/réponse/masquage.
 */
export function CommentItem({ comment, canHide, isReply = false, onReply, onLike, onHide }: CommentItemProps) {
  const { user } = useAuth();
  return (
    <div
      id={`comment-${comment.id}`}
      className={`scroll-mt-24 space-y-1.5 py-3 ${isReply ? "ml-8 border-l border-bord pl-4" : "border-b border-bord last:border-b-0"}`}
    >
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
        <div className="flex min-w-0 items-center gap-2">
          <AuthorAvatar src={comment.authorAvatarUrl} alt={comment.authorUsername} size={24} />
          <Link href={`/auteurs/${comment.authorId}`} className="truncate font-medium text-encre hover:underline">
            {comment.authorUsername}
          </Link>
          <span className="shrink-0">· <RelativeTime isoDate={comment.createdAt} /></span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {onReply ? (
            <button type="button" onClick={() => onReply(comment.id)} className="font-medium hover:text-encre">
              Répondre
            </button>
          ) : null}
          {canHide ? (
            <button type="button" onClick={() => onHide(comment.id)} className="hover:text-encre">Masquer</button>
          ) : null}
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-encre">{comment.body}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => (user ? onLike(comment.id) : openAuthPopup())}
          aria-pressed={comment.likedByMe}
          aria-label={`${comment.likeCount} j'aime`}
          className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold tabular-nums transition-colors ${comment.likedByMe ? "bg-pilule text-encre" : "text-muted hover:bg-pilule hover:text-encre"}`}
        >
          <ThumbsUp size={15} strokeWidth={1.75} className={comment.likedByMe ? "fill-encre text-encre" : ""} aria-hidden="true" />
          <span>{comment.likeCount}</span>
        </button>
      </div>
    </div>
  );
}
