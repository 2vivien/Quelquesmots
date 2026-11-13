"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openAuthPopup } from "@/lib/open-auth";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";
import { useInteractionState } from "./useInteractionState";

const EMPTY_STATE: InteractionState = { likedIds: [], dislikedIds: [], bookmarkedIds: [], blockedUserIds: [], followedUserIds: [] };

/** Hook optimiste gérant les réactions Like (pouce haut) et Unlike (pouce bas) avec compteurs. */
export function useLike(postId: string, initialCount: number, initialDislikeCount = 0) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useInteractionState();
  const liked = data?.likedIds.includes(postId) ?? false;
  const disliked = data?.dislikedIds.includes(postId) ?? false;
  const key = ["interactions", user?.id ?? "guest"];

  const likeMut = useMutation({
    mutationFn: () => interactionsService.toggleLike(user!.id, postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InteractionState>(key);
      qc.setQueryData<InteractionState>(key, (old) => {
        const base = old ?? EMPTY_STATE;
        const has = base.likedIds.includes(postId);
        return { ...base, likedIds: has ? base.likedIds.filter((id) => id !== postId) : [...base.likedIds, postId], dislikedIds: has ? base.dislikedIds : base.dislikedIds.filter((id) => id !== postId) };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); toast.error("Impossible d'enregistrer votre réaction."); },
  });

  const dislikeMut = useMutation({
    mutationFn: () => interactionsService.toggleDislike(user!.id, postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InteractionState>(key);
      qc.setQueryData<InteractionState>(key, (old) => {
        const base = old ?? EMPTY_STATE;
        const has = base.dislikedIds.includes(postId);
        return { ...base, dislikedIds: has ? base.dislikedIds.filter((id) => id !== postId) : [...base.dislikedIds, postId], likedIds: has ? base.likedIds : base.likedIds.filter((id) => id !== postId) };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); toast.error("Impossible d'enregistrer votre réaction."); },
  });

  const guard = (fn: () => void) => { if (!user) { openAuthPopup(); return; } fn(); };
  return {
    liked,
    disliked,
    count: initialCount + (liked ? 1 : 0),
    dislikeCount: initialDislikeCount + (disliked ? 1 : 0),
    toggle: () => guard(() => !likeMut.isPending && likeMut.mutate()),
    toggleDislike: () => guard(() => !dislikeMut.isPending && dislikeMut.mutate()),
  };
}
