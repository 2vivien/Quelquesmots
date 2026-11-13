"use client";

import { useViewTracker } from "@/features/interactions";

interface ViewTrackerMountProps {
  postId: string;
  authorId: string;
}

/**
 * Composant feuille déclenchant l'enregistrement d'une vue après 5 secondes.
 * @param props Identifiant du texte et identifiant de l'auteur.
 */
export function ViewTrackerMount({ postId, authorId }: ViewTrackerMountProps) {
  useViewTracker(postId, authorId);
  return null;
}
