"use client";

import { BookmarkRow, LibraryTabs, useLibrary } from "@/features/library";

/** Page de la bibliothèque personnelle des favoris (écran 9). */
export default function LibraryPage() {
  const { bookmarks, isLoading } = useLibrary();

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-encre">Mes <span className="underline decoration-jaune decoration-4 underline-offset-2">écrits</span></h1>
      <LibraryTabs active="bookmarks" />
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl border-[1.5px] border-bord bg-pilule" />)}</div>
      ) : bookmarks.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">{bookmarks.map((p) => <BookmarkRow key={p.id} post={p} />)}</div>
      )}
    </div>
  );
}
