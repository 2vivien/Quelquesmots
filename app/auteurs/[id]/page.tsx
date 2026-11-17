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
    <div className="mx-auto max-w-[720px] space-y-6">
      <AuthorHeader
        author={author}
        actions={<ReportDialog targetType="USER" targetId={author.userId} targetLabel={author.username} />}
      />
      <section className="space-y-3">
        {/* Onglet actif unique : la page ne propose que les publications réelles de l'auteur. */}
        <div className="flex items-center gap-6 overflow-x-auto border-b-[1.5px] border-bord" role="tablist" aria-label="Contenu de l'auteur">
          <span role="tab" aria-selected="true" className="whitespace-nowrap border-b-[3px] border-encre pb-2.5 font-display text-[13px] uppercase tracking-wide text-encre">
            Publications
          </span>
        </div>
        {items.length === 0 ? (
          <p className="py-8 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
        ) : (
          <div className="space-y-3">{items.map((p) => <PostCard key={p.id} post={p} />)}</div>
        )}
      </section>
    </div>
  );
}
