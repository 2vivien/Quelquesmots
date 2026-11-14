import Link from "next/link";
import { BookmarkButton } from "@/features/interactions";
import type { PostSummary } from "@/features/posts";

interface BookmarkRowProps {
  post: PostSummary;
}

/**
 * Ligne d'un texte enregistré dans la bibliothèque personnelle.
 * @param props Texte mis en favori.
 */
export function BookmarkRow({ post }: BookmarkRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-bord bg-carte px-4 py-4 shadow-[2px_2px_0_0_var(--color-encre)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-encre)]">
      <Link href={`/mots/${post.id}`} className="min-w-0 flex-1 group">
        <p className="truncate font-serif text-lg text-encre group-hover:underline">{post.title}</p>
        <p className="truncate text-[13px] text-muted">Par {post.authorUsername}</p>
      </Link>
      <BookmarkButton postId={post.id} />
    </div>
  );
}
