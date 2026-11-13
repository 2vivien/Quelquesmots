"use client";

import { useFollow } from "../hooks/useFollow";

interface FollowButtonProps {
  targetUserId: string;
  authorLabel?: string;
  variant?: "inline" | "profile";
}

/**
 * Bouton Suivre : pastille noire devant la date d'un texte ou bouton sur la page auteur.
 * @param props Identifiant de l'auteur cible et variante visuelle.
 */
export function FollowButton({ targetUserId, authorLabel, variant = "inline" }: FollowButtonProps) {
  const { following, isSelf, toggle } = useFollow(targetUserId, 0, authorLabel);
  if (isSelf) return null;
  if (variant === "inline") {
    if (following) return null;
    return (
      <>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggle(); }}
          className="inline-flex shrink-0 items-center rounded-full bg-encre-fort px-2.5 py-0.5 text-[11px] font-medium text-ivoire transition-opacity hover:opacity-85"
        >
          Suivre
        </button>
        <span aria-hidden="true">·</span>
      </>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={following}
      className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors ${following ? "border border-bord bg-carte text-encre hover:bg-pilule" : "bg-encre-fort text-ivoire hover:opacity-90"}`}
    >
      {following ? "Suivi" : "Suivre"}
    </button>
  );
}
