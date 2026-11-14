"use client";

import Link from "next/link";
import { FileText, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { RelativeTime } from "@/components/ui/RelativeTime";
import type { PostRecord } from "@/features/posts";

interface DraftRowProps {
  draft: PostRecord;
  onDelete: (id: string) => void;
}

/**
 * Ligne de brouillon dans l'écran 9 avec menu contextuel « … » (Modifier, Supprimer).
 * @param props Brouillon à afficher et action de suppression.
 */
export function DraftRow({ draft, onDelete }: DraftRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-bord bg-carte px-4 py-4 shadow-[2px_2px_0_0_var(--color-encre)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-encre)]">
      <Link href={`/studio/${draft.id}`} className="flex min-w-0 items-center gap-3.5 group">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-pilule text-muted">
          <FileText size={18} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-encre group-hover:underline">
            {draft.title || "Sans titre"}
          </p>
          <p className="text-[13px] text-muted"><RelativeTime isoDate={draft.updatedAt} prefix="Modifié" /></p>
        </div>
      </Link>
      <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Actions du brouillon" className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border-[1.5px] border-bord bg-carte text-encre transition-colors hover:bg-pilule">
        <MoreHorizontal size={18} strokeWidth={1.5} />
      </button>
      {menuOpen ? (
        <div className="absolute right-0 top-16 z-20 w-44 rounded-2xl border-[1.5px] border-bord bg-carte py-1.5 shadow-[3px_3px_0_0_var(--color-encre)]">
          <Link href={`/studio/${draft.id}`} className="block px-4 py-2 text-sm text-encre hover:bg-pilule">Modifier</Link>
          <button type="button" onClick={() => { setMenuOpen(false); onDelete(draft.id); }} className="block w-full px-4 py-2 text-left text-sm text-encre hover:bg-pilule">
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );
}
