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
    props.saveStatus === "saving"
      ? "Enregistrement…"
      : props.saveStatus === "saved"
        ? "Enregistré"
        : props.saveStatus === "error"
          ? "Échec — Réessayer"
          : "Enregistrer";
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-bord pb-4">
      <Link href="/" className="inline-flex min-h-[40px] items-center gap-2 text-sm text-encre hover:underline">
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>Retour</span>
      </Link>
      <div className="flex items-center gap-2">
        <button type="button" onClick={props.onSave} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-[1.5px] border-bord bg-carte px-4 py-1.5 text-sm font-semibold text-encre shadow-[2px_2px_0_0_var(--color-encre)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-encre)]">
          <Bookmark size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="whitespace-nowrap">{statusLabel}</span>
        </button>
        <button type="button" onClick={props.onTogglePreview} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-[1.5px] border-bord bg-carte px-4 py-1.5 text-sm font-semibold text-encre shadow-[2px_2px_0_0_var(--color-encre)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-encre)]">
          <Eye size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="whitespace-nowrap">{props.previewOpen ? "Éditer" : "Aperçu"}</span>
        </button>
        <button type="button" disabled={!props.canPublish} onClick={props.onOpenPublish} className="btn-noir !min-h-[40px] !px-5 !text-sm disabled:opacity-40">
          Publier
        </button>
      </div>
    </header>
  );
}
