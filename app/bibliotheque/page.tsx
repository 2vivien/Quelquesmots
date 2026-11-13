"use client";

import { BookmarkRow, LibraryTabs, useLibrary } from "@/features/library";

/** Page de la bibliothèque personnelle des favoris (écran 9). */
export default function LibraryPage() {
  const { bookmarks, isLoading } = useLibrary();

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <h1 className="font-serif text-3xl text-encre">Mes écrits</h1>
      <LibraryTabs active="bookmarks" />
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-[16px] bg-pilule" />
      ) : bookmarks.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div>{bookmarks.map((p) => <BookmarkRow key={p.id} post={p} />)}</div>
      )}
    </div>
  );
}
