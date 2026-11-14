import { FeedView } from "@/features/feed";

import { postsService } from "@/features/posts";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ theme?: string }>;
}

/** Page d'accueil : Mur éditorial des textes courts. */
export default async function HomePage({ searchParams }: HomePageProps) {
  const { theme: themeId } = await searchParams;
  const initialPage = await postsService.listFeed({
    themeId,
    sort: "recent",
    limit: 10,
    viewerId: null,
  });

  return <FeedView initialTheme={themeId ?? ""} initialPage={initialPage} />;
}
