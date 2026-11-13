"use client";

import { formatCount } from "@/lib/format";
import { useFollow } from "../hooks/useFollow";

/**
 * Compteur réactif du nombre de suivis d'un auteur.
 * @param props Identifiant de l'auteur et compteur initial.
 */
export function FollowerCount({ targetUserId, baseCount }: { targetUserId: string; baseCount: number }) {
  const { count } = useFollow(targetUserId, baseCount);
  return <span className="tabular-nums">{formatCount(count)} suivis</span>;
}
