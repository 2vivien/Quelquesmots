import Link from "next/link";
import type { PostRecord } from "@/features/posts";

interface RelatedPostsProps {
  posts: PostRecord[];
}

/**
 * Liste de textes similaires affichée en bas de la page de lecture.
 * @param props Textes apparentés par thème.
 */
export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;
  return (
    <section className="space-y-4 border-t border-bord pt-8">
      <h2 className="font-serif text-2xl text-encre">Textes similaires</h2>
      <div className="divide-y divide-bord">
        {posts.map((p) => (
          <Link key={p.id} href={`/mots/${p.slug}`} className="block py-3.5 group">
            <p className="font-serif text-lg text-encre group-hover:underline">{p.title}</p>
            <p className="mt-1 line-clamp-1 text-sm text-muted">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
