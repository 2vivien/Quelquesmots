import { FeedView } from "@/features/feed";

import { postsService } from "@/features/posts";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ theme?: string }>;
}

/** Page d'accueil : Mur éditorial des textes courts. */
export default async function HomePage({ searchParams }: HomePageProps) {
  const { theme } = await searchParams;
  const initialPage = await postsService.listFeed({
    themeSlug: theme,
    sort: "recent",
    limit: 10,
    viewerId: null,
  });

  return <FeedView initialTheme={theme ?? ""} initialPage={initialPage} />;
}
