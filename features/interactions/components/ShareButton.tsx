"use client";

import { Share2 } from "lucide-react";
import { useShare } from "../hooks/useShare";

interface ShareButtonProps {
  title: string;
  slug: string;
  showLabel?: boolean;
}

/**
 * Bouton de partage d'un texte (Web Share API ou copie du lien).
 * @param props Titre, slug et affichage optionnel du libellé « Partager ».
 */
export function ShareButton({ title, slug, showLabel = false }: ShareButtonProps) {
  const { share } = useShare(title, slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void share();
      }}
      aria-label="Partager ce texte"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bord bg-carte text-muted transition-colors hover:border-encre hover:bg-pilule hover:text-encre"
    >
      <Share2 size={16} strokeWidth={1.5} aria-hidden="true" />
      {showLabel ? <span className="hidden sm:inline">Partager</span> : null}
    </button>
  );
}
