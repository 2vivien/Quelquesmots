"use client";

import { useState } from "react";
import { AuthorRow, type AuthorProfile } from "@/features/authors";
import type { FeedPage } from "@/features/posts";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { PostList } from "./PostList";
import { TagList } from "./TagList";

interface ThemeDetailViewProps {
  themeSlug: string;
  relatedTags: string[];
  initialPage: FeedPage;
  authors: AuthorProfile[];
}

/**
 * Corps de la page thème avec tags associés et onglets Récents · Plus appréciés · Auteurs.
 * @param props Slug du thème, tags associés, première page de textes et auteurs actifs.
 */
export function ThemeDetailView({ themeSlug, relatedTags, initialPage, authors }: ThemeDetailViewProps) {
  const [tab, setTab] = useState<"recent" | "top" | "authors">("recent");
  const sort = tab === "top" ? "top" : "recent";
  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteFeed({
    themeSlug,
    sort,
    initialPage: sort === "recent" ? initialPage : undefined,
  });

  return (
    <div className="space-y-6">
      <TagList tags={relatedTags} pill />
      <div className="flex items-center gap-6 border-b border-bord text-sm">
        <button type="button" onClick={() => setTab("recent")} className={`border-b-2 pb-2.5 ${tab === "recent" ? "border-encre font-medium text-encre" : "border-transparent text-muted"}`}>Récents</button>
        <button type="button" onClick={() => setTab("top")} className={`border-b-2 pb-2.5 ${tab === "top" ? "border-encre font-medium text-encre" : "border-transparent text-muted"}`}>Plus appréciés</button>
        <button type="button" onClick={() => setTab("authors")} className={`border-b-2 pb-2.5 ${tab === "authors" ? "border-encre font-medium text-encre" : "border-transparent text-muted"}`}>Auteurs</button>
      </div>
      {tab === "authors" ? (
        <div>{authors.map((a) => <AuthorRow key={a.userId} author={a} />)}</div>
      ) : (
        <PostList posts={posts} isLoading={isLoading} hasMore={Boolean(hasNextPage)} onLoadMore={() => void fetchNextPage()} isFetchingMore={isFetchingNextPage} />
      )}
    </div>
  );
}
