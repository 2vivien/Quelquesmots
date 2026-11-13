"use client";

import { useState } from "react";
import type { FeedPage } from "@/features/posts";
import { useThemes } from "@/features/themes";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { FeedChips } from "./FeedChips";
import { FeedSearch } from "./FeedSearch";
import { PostList } from "./PostList";

/** Vue interactive du Mur d'accueil avec recherche, 55 thèmes dépliables, tri et flux infini. */
export function FeedView({ initialTheme = "", initialPage }: { initialTheme?: string; initialPage: FeedPage }) {
  const [theme, setTheme] = useState(initialTheme);
  const [sort, setSort] = useState<"recent" | "top">("recent");
  const { data: themes = [] } = useThemes();
  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteFeed({
    themeSlug: theme || undefined,
    sort,
    initialPage: theme === initialTheme && sort === "recent" ? initialPage : undefined,
  });

  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      <div className="md:hidden">
        <FeedSearch />
      </div>
      <FeedChips activeTheme={theme} themes={themes} onSelectTheme={setTheme} />
      <div className="flex items-center gap-5 border-b border-bord text-sm">
        <button type="button" onClick={() => setSort("recent")} className={`border-b-2 pb-2 ${sort === "recent" ? "border-encre font-medium text-encre" : "border-transparent text-muted"}`}>Récents</button>
        <button type="button" onClick={() => setSort("top")} className={`border-b-2 pb-2 ${sort === "top" ? "border-encre font-medium text-encre" : "border-transparent text-muted"}`}>Populaires</button>
      </div>
      <PostList posts={posts} isLoading={isLoading} hasMore={Boolean(hasNextPage)} onLoadMore={() => void fetchNextPage()} isFetchingMore={isFetchingNextPage} />
    </div>
  );
}
