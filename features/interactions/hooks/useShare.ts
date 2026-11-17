"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";

/**
 * Hook de partage utilisant Web Share API ou copie du lien dans le presse-papier.
 * @param title Titre du texte partagé.
 * @param postId Identifiant du texte.
 * @returns Fonction déclenchant le partage.
 */
export function useShare(title: string, postId: string) {
  const share = async (): Promise<void> => {
    const url = `${window.location.origin}/mots/${postId}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Repli sur la copie du lien
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié");
  };
  return { share };
}

/**
 * Enregistre une vue après 5 secondes de lecture réelle et notifie l'interface
 * uniquement lorsque le serveur confirme que le compteur a été incrémenté.
 */
export function useViewTracker(
  postId: string,
  authorId: string,
  onCounted?: () => void,
): void {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.id === authorId) return;
    let active = true;
    const timer = setTimeout(() => {
      void interactionsService
        .recordView(postId)
        .then((counted) => {
          if (active && counted) onCounted?.();
        })
        .catch(() => {
          // Une erreur de métrique ne doit pas interrompre l'expérience de lecture.
        });
    }, 5000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [postId, authorId, user?.id, onCounted]);
}
