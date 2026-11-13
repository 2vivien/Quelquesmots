"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";

/**
 * Hook retournant les listes de likes, favoris et utilisateurs bloqués du lecteur.
 * @returns État d'interaction utilisateur via TanStack Query.
 */
export function useInteractionState() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["interactions", user?.id ?? "guest"],
    queryFn: () =>
      user
        ? interactionsService.getUserState(user.id)
        : Promise.resolve({ likedIds: [], dislikedIds: [], bookmarkedIds: [], blockedUserIds: [], followedUserIds: [] }),
  });
}
