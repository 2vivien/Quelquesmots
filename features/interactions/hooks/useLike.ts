"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openAuthPopup } from "@/lib/open-auth";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";
import { useInteractionState } from "./useInteractionState";

const EMPTY_STATE: InteractionState = {
  likedIds: [],
  dislikedIds: [],
  bookmarkedIds: [],
  blockedUserIds: [],
  followedUserIds: [],
};

/**
 * Hook optimiste gérant les likes/dislikes d'une publication.
 *
 * Source de vérité : l'état serveur (props `initialCount`/`initialDislikeCount` du rendu
 * + valeurs canoniques renvoyées par l'API à chaque confirmation). Les mises à jour optimistes
 * ajustent un compteur local ±1 ; celui-ci est ensuite réconcilié avec la valeur serveur.
 * Aucune valeur dérivée de deux caches disjoints n'est plus utilisée pour afficher le compteur.
 */
export function useLike(postId: string, initialCount: number, initialDislikeCount = 0) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useInteractionState();
  const userId = user?.id ?? "guest";
  const key = ["interactions", userId];
  const liked = data?.likedIds.includes(postId) ?? false;
  const disliked = data?.dislikedIds.includes(postId) ?? false;

  const [likeCount, setLikeCount] = useState(initialCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);

  const likeMutation = useMutation({
    mutationFn: () => interactionsService.toggleLike(user!.id, postId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InteractionState>(key);
      const currentLiked = previous?.likedIds.includes(postId) ?? liked;
      const currentDisliked = previous?.dislikedIds.includes(postId) ?? disliked;
      queryClient.setQueryData<InteractionState>(key, (current) => {
        const state = current ?? EMPTY_STATE;
        const alreadyLiked = state.likedIds.includes(postId);
        return {
          ...state,
          likedIds: alreadyLiked
            ? state.likedIds.filter((id) => id !== postId)
            : [...state.likedIds, postId],
          dislikedIds: alreadyLiked
            ? state.dislikedIds
            : state.dislikedIds.filter((id) => id !== postId),
        };
      });
      setLikeCount((count) => count + (currentLiked ? -1 : 1));
      if (currentDisliked && !currentLiked) setDislikeCount((count) => count - 1);
      return { previous, currentLiked, currentDisliked };
    },
    onSuccess: (result) => {
      setLikeCount(result.likeCount);
      setDislikeCount(result.dislikeCount);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      setLikeCount(initialCount);
      setDislikeCount(initialDislikeCount);
      toast.error("Impossible d'enregistrer votre réaction.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: () => interactionsService.toggleDislike(user!.id, postId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InteractionState>(key);
      const currentDisliked = previous?.dislikedIds.includes(postId) ?? disliked;
      const currentLiked = previous?.likedIds.includes(postId) ?? liked;
      queryClient.setQueryData<InteractionState>(key, (current) => {
        const state = current ?? EMPTY_STATE;
        const alreadyDisliked = state.dislikedIds.includes(postId);
        return {
          ...state,
          dislikedIds: alreadyDisliked
            ? state.dislikedIds.filter((id) => id !== postId)
            : [...state.dislikedIds, postId],
          likedIds: alreadyDisliked
            ? state.likedIds
            : state.likedIds.filter((id) => id !== postId),
        };
      });
      setDislikeCount((count) => count + (currentDisliked ? -1 : 1));
      if (currentLiked && !currentDisliked) setLikeCount((count) => count - 1);
      return { previous };
    },
    onSuccess: (result) => {
      setLikeCount(result.likeCount);
      setDislikeCount(result.dislikeCount);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      setLikeCount(initialCount);
      setDislikeCount(initialDislikeCount);
      toast.error("Impossible d'enregistrer votre réaction.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const guard = (action: () => void) => {
    if (!user) {
      openAuthPopup();
      return;
    }
    action();
  };

  return {
    liked,
    disliked,
    count: Math.max(0, likeCount),
    dislikeCount: Math.max(0, dislikeCount),
    toggle: () => guard(() => !likeMutation.isPending && likeMutation.mutate()),
    toggleDislike: () => guard(() => !dislikeMutation.isPending && dislikeMutation.mutate()),
    pending: likeMutation.isPending || dislikeMutation.isPending,
  };
}