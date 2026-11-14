"use client";

import Link from "next/link";
import { DraftRow, LibraryTabs, useLibrary } from "@/features/library";

/** Page des brouillons personnels (écran 9). */
export default function DraftsPage() {
  const { drafts, isLoading, deleteDraft } = useLibrary();

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase tracking-tight text-encre">Mes <span className="underline decoration-jaune decoration-4 underline-offset-2">écrits</span></h1>
        <Link href="/studio" className="btn-noir !min-h-[40px] !px-4 !text-sm">
          Nouveau texte
        </Link>
      </div>
      <LibraryTabs active="drafts" />
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl border-[1.5px] border-bord bg-pilule" />)}</div>
      ) : drafts.length === 0 ? (
        <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">{drafts.map((d) => <DraftRow key={d.id} draft={d} onDelete={(id) => deleteDraft.mutate(id)} />)}</div>
      )}
    </div>
  );
}
