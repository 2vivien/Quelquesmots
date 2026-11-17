"use client";

import { formatCount } from "@/lib/format";
import { useFollow } from "../hooks/useFollow";

interface FollowerCountProps {
  targetUserId: string;
  baseCount: number;
  /** Texte après le nombre — vide pour afficher uniquement le chiffre. */
  label?: string;
}

/**
 * Compteur réactif du nombre de suivis d'un auteur.
 * @param props Identifiant de l'auteur, compteur initial et libellé optionnel.
 */
export function FollowerCount({ targetUserId, baseCount, label = " suivis" }: FollowerCountProps) {
  const { count } = useFollow(targetUserId, baseCount);
  return (
    <span className="tabular-nums">
      {formatCount(count)}
      {label}
    </span>
  );
}