import { cache } from "react";
import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { displayAuthor } from "@/features/authors";
import { CommentList } from "@/features/comments";
import { TagList } from "@/features/feed";
import { postsService } from "@/features/posts";
import {
  ReaderActions,
  ReaderBody,
  ReaderHeader,
  ReaderHero,
  RelatedPosts,
  ViewTrackerMount,
} from "@/features/reader";

export const dynamic = "force-dynamic";

const getPostForId = cache((id: string) => postsService.getById(id));

interface PostPageProps {
  params: Promise<{ id: string }>;
}

/** Métadonnées SEO et indexation conditionnelle (noindex pour PRIVATE). */
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostForId(id);
  if (!post) return { title: "Texte introuvable — Quelques mots" };
  const author = displayAuthor({
    publishAs: post.publishAs,
    username: post.authorUsername,
    userId: post.authorId,
    firstName: post.authorFirstName,
    lastName: post.authorLastName,
  });
  return {
    title: `${post.title} — Quelques mots`,
    description: post.excerpt,
    robots: post.visibility === "PRIVATE" ? { index: false, follow: false } : undefined,
    openGraph: { title: post.title, description: `${post.excerpt} — Par ${author.label}` },
  };
}

/** Page de lecture éditoriale d'un texte court (écran 6). */
export default async function PostReaderPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getPostForId(id);
  if (!post) notFound();

  const related = await postsService.listRelated(post, null);
  const tagItems = post.tagIds.map((id, index) => ({ id, label: post.tagLabels[index] ?? id }));

  return (
    <article className="mx-auto max-w-[680px] space-y-8">
      <ViewTrackerMount postId={post.id} authorId={post.authorId} />
      <ReaderHero imageUrl={post.heroImageUrl} alt={post.title} />
      <ReaderHeader
        post={post}
        extraAction={<ReaderActions post={post} />}
      />
      <ReaderBody doc={post.contentJson} />
      <TagList tags={tagItems} />
      <CommentList postId={post.id} postAuthorId={post.authorId} commentsEnabled={post.commentsEnabled} />
      <RelatedPosts posts={related} />
    </article>
  );
}
