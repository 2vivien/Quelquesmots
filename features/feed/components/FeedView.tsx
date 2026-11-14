"use client";

import { useState } from "react";
import type { FeedPage } from "@/features/posts";
import { useThemes } from "@/features/themes";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { FeedChips } from "./FeedChips";
import { PostList } from "./PostList";

/** Vue interactive du Mur d'accueil avec recherche, 55 thèmes dépliables, tri et flux infini. */
export function FeedView({ initialTheme = "", initialPage }: { initialTheme?: string; initialPage: FeedPage }) {
  const [themeId, setThemeId] = useState(initialTheme);
  const [sort, setSort] = useState<"recent" | "top">("recent");
  const { data: themes = [] } = useThemes();
  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteFeed({
    themeId: themeId || undefined,
    sort,
    initialPage: themeId === initialTheme && sort === "recent" ? initialPage : undefined,
  });

  return (
    <div className="mx-auto max-w-[860px] space-y-4">
      <FeedChips activeTheme={themeId} themes={themes} onSelectTheme={setThemeId} />
      <div className="flex items-center gap-5 border-b border-bord text-sm">
        <button type="button" onClick={() => setSort("recent")} className={`border-b-2 pb-2 ${sort === "recent" ? "border-encre font-medium text-encre" : "border-transparent text-muted"}`}>Récents</button>
        <button type="button" onClick={() => setSort("top")} className={`border-b-2 pb-2 ${sort === "top" ? "border-encre font-medium text-encre" : "border-transparent text-muted"}`}>Populaires</button>
      </div>
      <PostList posts={posts} isLoading={isLoading} hasMore={Boolean(hasNextPage)} onLoadMore={() => void fetchNextPage()} isFetchingMore={isFetchingNextPage} />
    </div>
  );
}
