"use client";

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

/** Hook optimiste gérant les likes, dislikes et leurs compteurs. */
export function useLike(postId: string, initialCount: number, initialDislikeCount = 0) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useInteractionState();
  const userId = user?.id ?? "guest";
  const key = ["interactions", userId];
  const baseline = queryClient.getQueryData<InteractionState>(["interactions-baseline", userId]);
  const liked = data?.likedIds.includes(postId) ?? false;
  const disliked = data?.dislikedIds.includes(postId) ?? false;
  const baselineLiked = baseline?.likedIds.includes(postId) ?? false;
  const baselineDisliked = baseline?.dislikedIds.includes(postId) ?? false;
  const likeMutation = useMutation({
    mutationFn: () => interactionsService.toggleLike(user!.id, postId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InteractionState>(key);
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
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
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
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
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
    count: initialCount + Number(liked) - Number(baselineLiked),
    dislikeCount: initialDislikeCount + Number(disliked) - Number(baselineDisliked),
    toggle: () => guard(() => !likeMutation.isPending && likeMutation.mutate()),
    toggleDislike: () => guard(() => !dislikeMutation.isPending && dislikeMutation.mutate()),
  };
}
