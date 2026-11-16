import { FeedView } from "@/features/feed";

import { serverPostsService } from "@/features/posts/services/posts.server";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ theme?: string }>;
}

/** Page d'accueil : Mur éditorial des textes courts. */
export default async function HomePage({ searchParams }: HomePageProps) {
  const { theme: themeId } = await searchParams;
  const initialPage = await serverPostsService.listFeed({
    themeId,
    sort: "recent",
    limit: 10,
    viewerId: null,
  });

  return <FeedView initialTheme={themeId ?? ""} initialPage={initialPage} />;
}
