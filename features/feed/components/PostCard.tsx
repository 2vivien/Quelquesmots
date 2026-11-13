"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { motion } from "motion/react";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AuthorAvatar, displayAuthor } from "@/features/authors";
import { FollowButton } from "@/features/interactions";
import type { PostRecord } from "@/features/posts";
import { PostMetrics } from "./PostMetrics";
import { TagList } from "./TagList";

/** Carte éditoriale d'un texte court sur le Mur avec Suivre devant la date et agrandissement à droite. */
export function PostCard({ post }: { post: PostRecord }) {
  const author = displayAuthor({
    publishAs: post.publishAs,
    username: post.authorUsername,
    firstName: post.authorFirstName,
    lastName: post.authorLastName,
  });

  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="space-y-3 border-b border-bord py-6 first:pt-2">
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
        <div className="flex min-w-0 items-center gap-2">
          <AuthorAvatar src={post.authorAvatarUrl} alt={author.label} size={28} />
          {author.href ? <Link href={author.href} className="truncate font-medium text-encre hover:underline">{author.label}</Link> : <span className="truncate font-medium text-encre">{author.label}</span>}
          <span aria-hidden="true">·</span>
          {post.publishAs !== "ANONYMOUS" ? <FollowButton targetUserId={post.authorId} authorLabel={author.label} variant="inline" /> : null}
          {post.publishedAt ? <RelativeTime isoDate={post.publishedAt} /> : <span className="shrink-0">brouillon</span>}
        </div>
        <Link href={`/mots/${post.slug}`} title="Agrandir ce texte" aria-label={`Agrandir ${post.title}`} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-pilule hover:text-encre">
          <Maximize2 size={15} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
      <Link href={`/mots/${post.slug}`} className="group block space-y-2">
        <h2 className="font-serif text-[22px] font-normal leading-snug text-encre group-hover:underline">{post.title}</h2>
        <p className="line-clamp-2 text-[15px] leading-relaxed text-encre/85">{post.excerpt}</p>
      </Link>
      <TagList tags={post.tagSlugs} />
      <PostMetrics postId={post.id} slug={post.slug} title={post.title} likeCount={post.likeCount} dislikeCount={post.dislikeCount} commentCount={post.commentCount} viewCount={post.viewCount} />
    </motion.article>
  );
}
