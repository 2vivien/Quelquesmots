import Link from "next/link";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { displayAuthor } from "@/features/authors";
import { FollowButton } from "@/features/interactions";
import type { PostRecord } from "@/features/posts";
import { ReaderMetricsBar } from "./ReaderMetricsBar";
import { ReducePostButton } from "./ReducePostButton";

/** En-tête typographique d'un texte sur la page détaillée avec bouton pour réduire. */
export function ReaderHeader({ post, extraAction }: { post: PostRecord; extraAction?: React.ReactNode }) {
  const author = displayAuthor({
    publishAs: post.publishAs,
    username: post.authorUsername,
    userId: post.authorId,
    firstName: post.authorFirstName,
    lastName: post.authorLastName,
  });

  return (
    <header className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-[30px] font-normal leading-[1.15] text-encre sm:text-[44px]">{post.title}</h1>
        <ReducePostButton />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[15px] text-muted">
        <span>Par</span>
        {author.href ? <Link href={author.href} className="font-medium text-encre hover:underline">{author.label}</Link> : <span className="font-medium text-encre">{author.label}</span>}
        <span aria-hidden="true">·</span>
        {post.publishAs !== "ANONYMOUS" ? <FollowButton targetUserId={post.authorId} authorLabel={author.label} variant="inline" /> : null}
        {post.publishedAt ? <RelativeTime isoDate={post.publishedAt} /> : <span>Brouillon</span>}
      </div>
      <ReaderMetricsBar post={post} extraAction={extraAction} />
    </header>
  );
}
