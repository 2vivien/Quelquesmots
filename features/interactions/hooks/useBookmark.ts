"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openAuthPopup } from "@/lib/open-auth";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";
import { useInteractionState } from "./useInteractionState";

/**
 * Hook optimiste de mise en favori (Bibliothèque) d'un texte.
 * @param postId Identifiant du texte.
 * @returns État favori et action de bascule.
 */
export function useBookmark(postId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useInteractionState();
  const bookmarked = data?.bookmarkedIds.includes(postId) ?? false;

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("UNAUTHENTICATED");
      return interactionsService.toggleBookmark(user.id, postId);
    },
    onMutate: async () => {
      const key = ["interactions", user?.id ?? "guest"];
      const prev = qc.getQueryData<InteractionState>(key);
      qc.setQueryData<InteractionState>(key, (old) => {
        const base = old ?? { likedIds: [], dislikedIds: [], bookmarkedIds: [], blockedUserIds: [], followedUserIds: [] };
        const has = base.bookmarkedIds.includes(postId);
        return {
          ...base,
          bookmarkedIds: has
            ? base.bookmarkedIds.filter((id) => id !== postId)
            : [...base.bookmarkedIds, postId],
        };
      });
      return { prev };
    },
    onSuccess: (res) => {
      toast.success(
        res.bookmarked ? "Ajouté à votre bibliothèque" : "Retiré de votre bibliothèque",
      );
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["interactions", user?.id ?? "guest"], ctx.prev);
    },
  });

  const toggle = (): void => {
    if (!user) {
      openAuthPopup();
      return;
    }
    if (!mutation.isPending) mutation.mutate();
  };

  return { bookmarked, toggle };
}
