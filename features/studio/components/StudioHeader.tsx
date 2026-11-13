"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, Eye } from "lucide-react";
import type { SaveStatus } from "../stores/studio.store";

interface StudioHeaderProps {
  saveStatus: SaveStatus;
  previewOpen: boolean;
  canPublish: boolean;
  onSave: () => void;
  onTogglePreview: () => void;
  onOpenPublish: () => void;
}

/**
 * Barre supérieure du Studio fidèle à l'écran 8 de la maquette.
 * @param props État de sauvegarde et actions de la barre haute.
 */
export function StudioHeader(props: StudioHeaderProps) {
  const statusLabel =
    props.saveStatus === "saving" ? "Enregistrement…" : props.saveStatus === "saved" ? "Enregistré" : "Enregistrer";
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bord pb-4">
      <Link href="/" className="inline-flex min-h-[40px] items-center gap-2 text-sm text-encre hover:underline">
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>Retour</span>
      </Link>
      <div className="flex items-center gap-2">
        <button type="button" onClick={props.onSave} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-bord px-4 py-1.5 text-sm text-encre hover:bg-pilule">
          <Bookmark size={15} strokeWidth={1.5} aria-hidden="true" />
          <span className="whitespace-nowrap">{statusLabel}</span>
        </button>
        <button type="button" onClick={props.onTogglePreview} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-bord px-4 py-1.5 text-sm text-encre hover:bg-pilule">
          <Eye size={15} strokeWidth={1.5} aria-hidden="true" />
          <span className="whitespace-nowrap">{props.previewOpen ? "Éditer" : "Aperçu"}</span>
        </button>
        <button type="button" disabled={!props.canPublish} onClick={props.onOpenPublish} className="min-h-[40px] rounded-full bg-encre-fort px-5 py-1.5 text-sm font-medium text-ivoire disabled:opacity-40">
          Publier
        </button>
      </div>
    </header>
  );
}
