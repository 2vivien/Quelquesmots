"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openAuthPopup } from "@/lib/open-auth";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";
import { useInteractionState } from "./useInteractionState";

interface FollowBaseline {
  userId: string | null;
  targetUserId: string;
  count: number;
  following: boolean;
  ready: boolean;
}

/**
 * Hook optimiste de suivi d'un auteur et calcul du nombre de suivis.
 * @param targetUserId Identifiant de l'auteur cible.
 * @param baseCount Nombre de suivis initial issu du profil auteur.
 * @param authorLabel Nom affiché pour la confirmation.
 */
export function useFollow(targetUserId: string, baseCount = 0, authorLabel?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useInteractionState();
  const isSelf = Boolean(user && user.id === targetUserId);
  const following = data?.followedUserIds.includes(targetUserId) ?? false;
  const baseline = useRef<FollowBaseline>({
    userId: user?.id ?? null,
    targetUserId,
    count: baseCount,
    following,
    ready: !user || Boolean(data),
  });

  const contextChanged =
    baseline.current.userId !== (user?.id ?? null) ||
    baseline.current.targetUserId !== targetUserId ||
    baseline.current.count !== baseCount;

  if (contextChanged) {
    baseline.current = {
      userId: user?.id ?? null,
      targetUserId,
      count: baseCount,
      following,
      ready: !user || Boolean(data),
    };
  } else if (user && data && !baseline.current.ready) {
    baseline.current = { ...baseline.current, following, ready: true };
  }

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
          followedUserIds: has
            ? base.followedUserIds.filter((id) => id !== targetUserId)
            : [...base.followedUserIds, targetUserId],
        };
      });
      return { prev };
    },
    onSuccess: (res) => {
      if (authorLabel) {
        toast.success(res.following ? `Vous suivez ${authorLabel}` : `Vous ne suivez plus ${authorLabel}`);
      }
    },
    onError: (_error, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData(["interactions", user?.id ?? "guest"], ctx.prev);
      toast.error("Impossible de mettre à jour le suivi.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["authors"] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const toggle = (): void => {
    if (!user) {
      openAuthPopup();
      return;
    }
    if (!baseline.current.ready) {
      toast.info("Chargement de vos interactions…");
      return;
    }
    if (!isSelf && !mutation.isPending) mutation.mutate();
  };

  return {
    following,
    isSelf,
    count: baseCount + Number(following) - Number(baseline.current.following),
    toggle,
  };
}
