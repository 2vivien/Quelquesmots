import { notFound } from "next/navigation";
import { AuthorHeader, authorsService } from "@/features/authors";
import { PostCard } from "@/features/feed";
import { ReportDialog } from "@/features/moderation";
import { postsService } from "@/features/posts";

interface AuthorProfilePageProps {
  params: Promise<{ username: string }>;
}

/** Profil public d'un auteur et ses publications accessibles. */
export default async function AuthorProfilePage({ params }: AuthorProfilePageProps) {
  const { username } = await params;
  const author = await authorsService.getByUsername(username);
  if (!author) notFound();

  const { items } = await postsService.listFeed({
    authorUsername: author.username,
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
