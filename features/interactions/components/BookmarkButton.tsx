"use client";

import { Bookmark } from "lucide-react";
import { useBookmark } from "../hooks/useBookmark";

interface BookmarkButtonProps {
  postId: string;
}

/**
 * Bouton marque-page permettant d'enregistrer un texte dans sa bibliothèque.
 * @param props Identifiant du texte.
 */
export function BookmarkButton({ postId }: BookmarkButtonProps) {
  const { bookmarked, toggle } = useBookmark(postId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Retirer des favoris" : "Enregistrer dans la bibliothèque"}
      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-muted transition-colors hover:text-encre"
    >
      <Bookmark
        size={16}
        strokeWidth={1.5}
        className={bookmarked ? "fill-encre-fort text-encre-fort" : ""}
        aria-hidden="true"
      />
    </button>
  );
}
