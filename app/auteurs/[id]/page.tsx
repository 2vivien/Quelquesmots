import { notFound } from "next/navigation";

import { AuthorHeader } from "@/features/authors";
import { serverAuthorsService } from "@/features/authors/services/authors.server";
import { PostCard } from "@/features/feed";
import { ReportDialog } from "@/features/moderation";
import { serverPostsService } from "@/features/posts/services/posts.server";

export const dynamic = "force-dynamic";

interface AuthorProfilePageProps {
  params: Promise<{ id: string }>;
}

/** Profil public d'un auteur et ses publications accessibles. */
export default async function AuthorProfilePage({ params }: AuthorProfilePageProps) {
  const { id } = await params;
  const author = await serverAuthorsService.getById(id);
  if (!author) notFound();

  const { items } = await serverPostsService.listFeed({
    authorId: author.userId,
    limit: 20,
    viewerId: null,
  });

  return (
    <div className="mx-auto max-w-[720px] space-y-8">
      <AuthorHeader
        author={author}
        actions={<ReportDialog targetType="USER" targetId={author.userId} targetLabel={author.username} />}
      />
      <section className="space-y-2">
        <h2 className="font-serif text-2xl text-encre">Publications</h2>
        {items.length === 0 ? (
          <p className="py-8 font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
        ) : (
          <div>{items.map((p) => <PostCard key={p.id} post={p} />)}</div>
        )}
      </section>
    </div>
  );
}
