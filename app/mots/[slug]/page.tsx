import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { displayAuthor } from "@/features/authors";
import { CommentList } from "@/features/comments";
import { TagList } from "@/features/feed";
import { ReportDialog } from "@/features/moderation";
import { postsService } from "@/features/posts";
import {
  ReaderBody,
  ReaderHeader,
  ReaderHero,
  RelatedPosts,
  ViewTrackerMount,
} from "@/features/reader";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

/** Métadonnées SEO et indexation conditionnelle (noindex pour PRIVATE). */
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await postsService.getBySlug(slug, "user-emma");
  if (!post) return { title: "Texte introuvable — Quelques mots" };
  const author = displayAuthor({
    publishAs: post.publishAs,
    username: post.authorUsername,
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
  const { slug } = await params;
  const post = await postsService.getBySlug(slug, "user-emma");
  if (!post) notFound();

  const related = await postsService.listRelated(post, null);

  return (
    <article className="mx-auto max-w-[680px] space-y-8">
      <ViewTrackerMount postId={post.id} authorId={post.authorId} />
      <ReaderHero imageUrl={post.heroImageUrl} alt={post.title} />
      <ReaderHeader
        post={post}
        extraAction={<ReportDialog targetType="POST" targetId={post.id} targetLabel={post.title} />}
      />
      <ReaderBody doc={post.contentJson} />
      <TagList tags={post.tagSlugs} />
      <CommentList postId={post.id} postAuthorId={post.authorId} commentsEnabled={post.commentsEnabled} />
      <RelatedPosts posts={related} />
    </article>
  );
}
