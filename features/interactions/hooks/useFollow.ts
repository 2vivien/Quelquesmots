"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";
import { useInteractionState } from "./useInteractionState";

/**
 * Hook optimiste de suivi d'un auteur et calcul du nombre de suivis.
 * @param targetUserId Identifiant de l'auteur cible.
 * @param baseCount Nombre de suivis initial issu du profil auteur.
 * @param authorLabel Nom affiché pour la confirmation.
 */
export function useFollow(targetUserId: string, baseCount = 0, authorLabel?: string) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useInteractionState();
  const isSelf = Boolean(user && user.id === targetUserId);
  const following = data?.followedUserIds.includes(targetUserId) ?? false;

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("UNAUTHENTICATED");
      return interactionsService.toggleFollow(user.id, targetUserId);
    },
    onMutate: async () => {
      const key = ["interactions", user?.id ?? "guest"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InteractionState>(key);
      qc.setQueryData<InteractionState>(key, (old) => {
        const base = old ?? { likedIds: [], dislikedIds: [], bookmarkedIds: [], blockedUserIds: [], followedUserIds: [] };
        const has = base.followedUserIds.includes(targetUserId);
        return {
          ...base,
          followedUserIds: has ? base.followedUserIds.filter((id) => id !== targetUserId) : [...base.followedUserIds, targetUserId],
        };
      });
      return { prev };
    },
    onSuccess: (res) => {
      if (authorLabel) toast.success(res.following ? `Vous suivez ${authorLabel}` : `Vous ne suivez plus ${authorLabel}`);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["interactions", user?.id ?? "guest"], ctx.prev);
      toast.error("Impossible de mettre à jour le suivi.");
    },
  });

  const toggle = (): void => {
    if (!user) { router.push("/connexion"); return; }
    if (!isSelf && !mutation.isPending) mutation.mutate();
  };

  return { following, isSelf, count: baseCount + (following ? 1 : 0), toggle };
}
