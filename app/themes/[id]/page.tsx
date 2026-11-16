import { notFound } from "next/navigation";

import { serverAuthorsService } from "@/features/authors/services/authors.server";
import { ThemeDetailView } from "@/features/feed";
import { serverPostsService } from "@/features/posts/services/posts.server";
import { ThemeHero } from "@/features/themes";
import { serverThemesService } from "@/features/themes/services/themes.server";

export const dynamic = "force-dynamic";

interface ThemePageProps {
  params: Promise<{ id: string }>;
}

/** Page dédiée à un thème littéraire (écran 5). */
export default async function ThemeDetailPage({ params }: ThemePageProps) {
  const { id } = await params;
  const theme = await serverThemesService.getById(id);
  if (!theme) notFound();

  const [initialPage, authors] = await Promise.all([
    serverPostsService.listFeed({ themeId: theme.id, sort: "recent", limit: 10, viewerId: null }),
    serverAuthorsService.listDirectory(),
  ]);

  return (
    <div className="mx-auto max-w-[880px] space-y-8">
      <ThemeHero theme={theme} />
      <ThemeDetailView
        themeId={theme.id}
        initialPage={initialPage}
        authors={authors}
      />
    </div>
  );
}
