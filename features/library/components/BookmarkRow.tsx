import Link from "next/link";
import { BookmarkButton } from "@/features/interactions";
import type { PostRecord } from "@/features/posts";

interface BookmarkRowProps {
  post: PostRecord;
}

/**
 * Ligne d'un texte enregistré dans la bibliothèque personnelle.
 * @param props Texte mis en favori.
 */
export function BookmarkRow({ post }: BookmarkRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-bord py-4">
      <Link href={`/mots/${post.slug}`} className="min-w-0 flex-1 group">
        <p className="truncate font-serif text-lg text-encre group-hover:underline">{post.title}</p>
        <p className="truncate text-[13px] text-muted">Par {post.authorUsername}</p>
      </Link>
      <BookmarkButton postId={post.id} />
    </div>
  );
}
