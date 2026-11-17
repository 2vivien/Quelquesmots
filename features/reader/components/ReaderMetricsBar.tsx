"use client";

import { useCallback, useState } from "react";
import { Eye } from "lucide-react";
import { IconMessageChatbot } from "@tabler/icons-react";
import Link from "next/link";
import { BookmarkButton, LikeButton, ShareButton, useViewTracker } from "@/features/interactions";
import type { PostRecord } from "@/features/posts";
import { formatCount } from "@/lib/format";

/** Barre de métriques et d'actions sous le titre de la page de lecture. */
export function ReaderMetricsBar({ post, extraAction }: { post: PostRecord; extraAction?: React.ReactNode }) {
  const [viewCount, setViewCount] = useState(post.viewCount);
  const onViewCounted = useCallback(() => setViewCount((count) => count + 1), []);
  useViewTracker(post.id, post.authorId, onViewCounted);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-bord py-2.5 text-[13px] tabular-nums text-muted">
      <div className="flex items-center gap-5">
        <LikeButton postId={post.id} initialCount={post.likeCount} initialDislikeCount={post.dislikeCount} />
        <Link href={`/mots/${post.id}#commentaires`} aria-label={`${post.commentCount} commentaires`} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-pilule hover:text-encre">
          <IconMessageChatbot size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{formatCount(post.commentCount)}</span>
        </Link>
        <span className="inline-flex items-center gap-1.5" aria-label={`${viewCount} vues`}>
          <Eye size={16} strokeWidth={1.75} aria-hidden="true" />
          <span aria-live="polite">{formatCount(viewCount)}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <BookmarkButton postId={post.id} />
        <ShareButton title={post.title} postId={post.id} />
        {extraAction}
      </div>
    </div>
  );
}
