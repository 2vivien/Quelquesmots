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
    <div className="relative flex items-center justify-between gap-4 border-b border-bord py-4">
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
      <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Actions du brouillon" className="min-h-[40px] min-w-[40px] rounded-full text-muted hover:bg-pilule hover:text-encre flex items-center justify-center">
        <MoreHorizontal size={18} strokeWidth={1.5} />
      </button>
      {menuOpen ? (
        <div className="absolute right-0 top-14 z-20 w-40 rounded-[12px] border border-bord bg-carte py-1 shadow-sm">
          <Link href={`/studio/${draft.id}`} className="block px-4 py-2 text-sm text-encre hover:bg-pilule">Modifier</Link>
          <button type="button" onClick={() => { setMenuOpen(false); onDelete(draft.id); }} className="block w-full px-4 py-2 text-left text-sm text-encre hover:bg-pilule">
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );
}
