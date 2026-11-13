"use client";

import Link from "next/link";
import { DraftRow, LibraryTabs, useLibrary } from "@/features/library";

/** Page des brouillons personnels (écran 9). */
export default function DraftsPage() {
  const { drafts, isLoading, deleteDraft } = useLibrary();

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-encre">Mes écrits</h1>
        <Link href="/studio" className="rounded-full bg-encre-fort px-4 py-2 text-sm text-ivoire">
          Nouveau texte
        </Link>
      </div>
      <LibraryTabs active="drafts" />
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-[16px] bg-pilule" />
      ) : drafts.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div>{drafts.map((d) => <DraftRow key={d.id} draft={d} onDelete={(id) => deleteDraft.mutate(id)} />)}</div>
      )}
    </div>
  );
}
