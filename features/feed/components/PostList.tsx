"use client";

import type { PostRecord } from "@/features/posts";
import { PostCard } from "./PostCard";

interface PostListProps {
  posts: PostRecord[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isFetchingMore: boolean;
}

/**
 * Flux vertical de cartes de texte avec états de chargement et de fin.
 * @param props Liste des textes et contrôles de pagination.
 */
export function PostList({ posts, isLoading, hasMore, onLoadMore, isFetchingMore }: PostListProps) {
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 border-b border-bord pb-6 animate-pulse">
            <div className="h-4 w-36 rounded-full bg-pilule" />
            <div className="h-6 w-2/3 rounded-full bg-pilule" />
            <div className="h-4 w-full rounded-full bg-pilule" />
          </div>
        ))}
      </div>
    );
  }
  if (posts.length === 0) {
    return <p className="py-16 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>;
  }
  return (
    <div>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      {hasMore ? (
        <div className="pt-8 text-center">
          <button type="button" onClick={onLoadMore} disabled={isFetchingMore} className="min-h-[44px] rounded-full border border-bord px-6 py-2 text-sm text-encre transition-colors hover:bg-pilule">
            {isFetchingMore ? "Chargement…" : "Charger plus"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
