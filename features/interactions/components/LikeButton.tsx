"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { formatCount } from "@/lib/format";
import { useLike } from "../hooks/useLike";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialDislikeCount?: number;
}

/**
 * Boutons distincts de réaction par pouces avec compteurs (pouce levé / pouce baissé).
 * @param props Identifiant du texte et compteurs initiaux.
 */
export function LikeButton({ postId, initialCount, initialDislikeCount = 0 }: LikeButtonProps) {
  const { liked, disliked, count, dislikeCount, toggle, toggleDislike } = useLike(postId, initialCount, initialDislikeCount);
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <div className="inline-flex items-center gap-3">
      <button type="button" onClick={stop(toggle)} aria-pressed={liked} aria-label={`${count} j'aime`} className="inline-flex min-h-[36px] items-center gap-1.5 text-[13px] tabular-nums text-muted transition-colors hover:text-encre">
        <ThumbsUp size={16} strokeWidth={1.5} className={liked ? "fill-encre-fort text-encre-fort" : ""} aria-hidden="true" />
        <span>{formatCount(count)}</span>
      </button>
      <button type="button" onClick={stop(toggleDislike)} aria-pressed={disliked} aria-label={`${dislikeCount} je n'aime pas`} className="inline-flex min-h-[36px] items-center gap-1.5 text-[13px] tabular-nums text-muted transition-colors hover:text-encre">
        <ThumbsDown size={16} strokeWidth={1.5} className={disliked ? "fill-encre-fort text-encre-fort" : ""} aria-hidden="true" />
        <span>{formatCount(dislikeCount)}</span>
      </button>
    </div>
  );
}
