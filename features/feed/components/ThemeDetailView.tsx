"use client";

import { useState } from "react";
import { AuthorRow, type AuthorProfile } from "@/features/authors";
import type { FeedPage } from "@/features/posts";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { PostList } from "./PostList";

interface ThemeDetailViewProps {
  themeId: string;
  initialPage: FeedPage;
  authors: AuthorProfile[];
}

/**
 * Corps de la page thème avec tags associés et onglets Récents · Plus appréciés · Auteurs.
 * @param props Identifiant du thème, première page de textes et auteurs actifs.
 */
export function ThemeDetailView({ themeId, initialPage, authors }: ThemeDetailViewProps) {
  const [tab, setTab] = useState<"recent" | "top" | "authors">("recent");
  const sort = tab === "top" ? "top" : "recent";
  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteFeed({
    themeId,
    sort,
    initialPage: sort === "recent" ? initialPage : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 border-b border-bord text-sm">
        <button type="button" onClick={() => setTab("recent")} className={`rounded-full border-[1.5px] border-bord px-4 py-2 text-xs font-bold transition-all ${tab === "recent" ? "bg-jaune text-encre shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte text-muted hover:text-encre"}`}>Récents</button>
        <button type="button" onClick={() => setTab("top")} className={`rounded-full border-[1.5px] border-bord px-4 py-2 text-xs font-bold transition-all ${tab === "top" ? "bg-jaune text-encre shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte text-muted hover:text-encre"}`}>Plus appréciés</button>
        <button type="button" onClick={() => setTab("authors")} className={`rounded-full border-[1.5px] border-bord px-4 py-2 text-xs font-bold transition-all ${tab === "authors" ? "bg-jaune text-encre shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte text-muted hover:text-encre"}`}>Auteurs</button>
      </div>
      {tab === "authors" ? (
        <div>{authors.map((a) => <AuthorRow key={a.userId} author={a} />)}</div>
      ) : (
        <PostList posts={posts} isLoading={isLoading} hasMore={Boolean(hasNextPage)} onLoadMore={() => void fetchNextPage()} isFetchingMore={isFetchingNextPage} />
      )}
    </div>
  );
}
