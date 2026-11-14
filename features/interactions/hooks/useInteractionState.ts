"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";

const EMPTY_STATE: InteractionState = {
  likedIds: [],
  dislikedIds: [],
  bookmarkedIds: [],
  blockedUserIds: [],
  followedUserIds: [],
};

/**
 * Hook retournant les interactions du lecteur.
 * Une copie de référence séparée permet de comparer les compteurs serveur
 * aux mutations optimistes sans ajouter deux fois une réaction déjà existante.
 */
export function useInteractionState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "guest";

  return useQuery({
    queryKey: ["interactions", userId],
    queryFn: async () => {
      const state = user ? await interactionsService.getUserState(user.id) : EMPTY_STATE;
      queryClient.setQueryData<InteractionState>(["interactions-baseline", userId], state);
      return state;
    },
  });
}
