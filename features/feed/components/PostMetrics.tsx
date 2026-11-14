import { Eye } from "lucide-react";
import { IconMessageChatbot } from "@tabler/icons-react";
import { BookmarkButton, LikeButton, ShareButton } from "@/features/interactions";
import { formatCount } from "@/lib/format";

interface PostMetricsProps {
  postId: string;
  title: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  viewCount: number;
}

/**
 * Ligne de métriques d'un texte (j'aime, je n'aime pas, commentaires, vues, favori, partage).
 * @param props Identifiants et compteurs du texte.
 */
export function PostMetrics(props: PostMetricsProps) {
  return (
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-4 text-[13px] tabular-nums text-muted">
        <LikeButton postId={props.postId} initialCount={props.likeCount} initialDislikeCount={props.dislikeCount} />
        <span className="inline-flex items-center gap-1.5" aria-label={`${props.commentCount} commentaires`}>
          <IconMessageChatbot size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{formatCount(props.commentCount)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5" aria-label={`${props.viewCount} vues`}>
          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>{formatCount(props.viewCount)}</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <BookmarkButton postId={props.postId} />
        <ShareButton title={props.title} postId={props.postId} />
      </div>
    </div>
  );
}
