"use client";

import { Share2 } from "lucide-react";
import { useShare } from "../hooks/useShare";

interface ShareButtonProps {
  title: string;
  postId: string;
}

/** Partage d'un texte (Web Share API ou copier le lien). Icone seule, sans libellé. */
export function ShareButton({ title, postId }: ShareButtonProps) {
  const { share } = useShare(title, postId);
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
    </button>
  );
}
