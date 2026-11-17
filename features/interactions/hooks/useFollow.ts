"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openAuthPopup } from "@/lib/open-auth";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";
import { useInteractionState } from "./useInteractionState";

/**
 * Hook optimiste de suivi d'un auteur. Le compteur suit la même logique que useLike :
 * l'état React Query d'interactions porte la vérité utilisateur ;
 * le delta optimiste est purgé à la confirmation serveur / annulation.
 */
export function useFollow(targetUserId: string, baseCount = 0, authorLabel?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useInteractionState();
  const userId = user?.id ?? "guest";
  const key = ["interactions", userId];
  const isSelf = Boolean(user && user.id === targetUserId);
  const following = data?.followedUserIds.includes(targetUserId) ?? false;

  const [followDelta, setFollowDelta] = useState(0);

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("UNAUTHENTICATED");
      return interactionsService.toggleFollow(user.id, targetUserId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InteractionState>(key);
      const currentFollowing = previous?.followedUserIds.includes(targetUserId) ?? following;
      queryClient.setQueryData<InteractionState>(key, (current) => {
        const state = current ?? {
          likedIds: [],
          dislikedIds: [],
          bookmarkedIds: [],
          blockedUserIds: [],
          followedUserIds: [],
        };
        const alreadyFollowing = state.followedUserIds.includes(targetUserId);
        return {
          ...state,
          followedUserIds: alreadyFollowing
            ? state.followedUserIds.filter((id) => id !== targetUserId)
            : [...state.followedUserIds, targetUserId],
        };
      });
      setFollowDelta((delta) => delta + (currentFollowing ? -1 : 1));
      return { previous };
    },
    onSuccess: (result) => {
      if (authorLabel) {
        toast.success(
          result.following ? `Vous suivez ${authorLabel}` : `Vous ne suivez plus ${authorLabel}`,
        );
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      setFollowDelta(0);
      toast.error("Impossible de mettre à jour le suivi.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["authors"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const toggle = (): void => {
    if (!user) {
      openAuthPopup();
      return;
    }
    if (!isSelf && !mutation.isPending) mutation.mutate();
  };

  return {
    following,
    isSelf,
    count: Math.max(0, baseCount + followDelta),
    toggle,
    pending: mutation.isPending,
  };
}