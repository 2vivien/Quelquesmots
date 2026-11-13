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
    <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="carte group space-y-2 p-4 transition-shadow duration-200 hover:shadow-[0_2px_4px_rgba(40,37,36,0.06),0_14px_36px_rgba(40,37,36,0.11)] sm:p-5">
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
        <div className="flex min-w-0 items-center gap-2">
          <AuthorAvatar src={post.authorAvatarUrl} alt={author.label} size={32} ring />
          {author.href ? <Link href={author.href} className="truncate font-bold text-encre hover:underline">{author.label}</Link> : <span className="truncate font-bold text-encre">{author.label}</span>}
          <span aria-hidden="true" className="font-bold">·</span>
          {post.publishAs !== "ANONYMOUS" ? <FollowButton targetUserId={post.authorId} authorLabel={author.label} variant="inline" /> : null}
          {post.publishedAt ? <RelativeTime isoDate={post.publishedAt} /> : <span className="shrink-0">brouillon</span>}
        </div>
        <Link href={`/mots/${post.slug}`} title="Agrandir ce texte" aria-label={`Agrandir ${post.title}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bord bg-carte text-encre transition-colors hover:bg-pilule">
          <Maximize2 size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
      <Link href={`/mots/${post.slug}`} className="group block space-y-2">
        <h2 className="text-[19px] font-extrabold leading-[1.2] tracking-tight text-encre group-hover:underline decoration-2 underline-offset-2 sm:text-[20px]">{post.title}</h2>
        <p className="line-clamp-2 text-[15px] leading-relaxed text-encre/85">{post.excerpt}</p>
      </Link>
      <TagList tags={post.tagSlugs} />
      <PostMetrics postId={post.id} slug={post.slug} title={post.title} likeCount={post.likeCount} dislikeCount={post.dislikeCount} commentCount={post.commentCount} viewCount={post.viewCount} />
    </motion.article>
  );
}
