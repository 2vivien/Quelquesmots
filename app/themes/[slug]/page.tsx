import { notFound } from "next/navigation";
import { authorsService } from "@/features/authors";
import { ThemeDetailView } from "@/features/feed";
import { postsService } from "@/features/posts";
import { ThemeHero, themesService } from "@/features/themes";

interface ThemePageProps {
  params: Promise<{ slug: string }>;
}

/** Page dédiée à un thème littéraire (écran 5). */
export default async function ThemeDetailPage({ params }: ThemePageProps) {
  const { slug } = await params;
  const theme = await themesService.getBySlug(slug);
  if (!theme) notFound();

  const [initialPage, authors] = await Promise.all([
    postsService.listFeed({ themeSlug: slug, sort: "recent", limit: 10, viewerId: null }),
    authorsService.listDirectory(),
  ]);

  return (
    <div className="mx-auto max-w-[880px] space-y-8">
      <ThemeHero theme={theme} />
      <ThemeDetailView
        themeSlug={slug}
        relatedTags={theme.relatedTags}
        initialPage={initialPage}
        authors={authors}
      />
    </div>
  );
}
