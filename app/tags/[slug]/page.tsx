import { PostCard } from "@/features/feed";
import { postsService } from "@/features/posts";

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

/** Page listant les textes associés à un tag éditorial. */
export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const { items } = await postsService.listFeed({ tagSlug: slug, limit: 20, viewerId: null });

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <header className="space-y-1 border-b border-bord pb-4">
        <h1 className="font-serif text-3xl text-encre">#{slug}</h1>
        <p className="text-sm text-muted">{items.length} texte(s) publié(s)</p>
      </header>
      {items.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div>{items.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}
    </div>
  );
}
