import { Eye, MessageCircle } from "lucide-react";
import { BookmarkButton, LikeButton, ShareButton } from "@/features/interactions";
import type { PostRecord } from "@/features/posts";
import { formatCount } from "@/lib/format";

/** Barre de métriques et d'actions sous le titre de la page de lecture. */
export function ReaderMetricsBar({ post, extraAction }: { post: PostRecord; extraAction?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-bord py-2.5 text-[13px] tabular-nums text-muted">
      <div className="flex items-center gap-5">
        <LikeButton postId={post.id} initialCount={post.likeCount} initialDislikeCount={post.dislikeCount} />
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>{formatCount(post.commentCount)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>{formatCount(post.viewCount)}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <BookmarkButton postId={post.id} />
        <ShareButton title={post.title} slug={post.slug} showLabel />
        {extraAction}
      </div>
    </div>
  );
}
