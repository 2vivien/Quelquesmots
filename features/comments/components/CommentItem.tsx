"use client";

import Link from "next/link";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AuthorAvatar } from "@/features/authors";
import type { CommentItemData } from "../types/comments.types";

interface CommentItemProps {
  comment: CommentItemData;
  canHide: boolean;
  onReply?: (parentId: string) => void;
  onHide: (id: string) => void;
}

/**
 * Affiche un commentaire ou une réponse dans la discussion d'un texte.
 * @param props Données du commentaire et actions d'auteur/réponse.
 */
export function CommentItem({ comment, canHide, onReply, onHide }: CommentItemProps) {
  return (
    <div className={`space-y-1.5 py-3 ${comment.parentId ? "ml-8 border-l border-bord pl-4" : "border-b border-bord"}`}>
      <div className="flex items-center justify-between text-[13px] text-muted">
        <div className="flex items-center gap-2">
          <AuthorAvatar src={comment.authorAvatarUrl} alt={comment.authorUsername} size={24} />
          <Link href={`/auteurs/${comment.authorUsername}`} className="font-medium text-encre hover:underline">
            {comment.authorUsername}
          </Link>
          <span>· <RelativeTime isoDate={comment.createdAt} /></span>
        </div>
        <div className="flex items-center gap-3">
          {onReply && !comment.parentId ? (
            <button type="button" onClick={() => onReply(comment.id)} className="hover:text-encre">Répondre</button>
          ) : null}
          {canHide ? (
            <button type="button" onClick={() => onHide(comment.id)} className="hover:text-encre">Masquer</button>
          ) : null}
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-encre">{comment.body}</p>
    </div>
  );
}
