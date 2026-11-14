"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openAuthPopup } from "@/lib/open-auth";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { interactionsService } from "../services/interactions.service";
import type { InteractionState } from "../types/interactions.types";
import { useInteractionState } from "./useInteractionState";

const EMPTY_STATE: InteractionState = { likedIds: [], dislikedIds: [], bookmarkedIds: [], blockedUserIds: [], followedUserIds: [] };

interface LikeBaseline {
  postId: string;
  userId: string | null;
  initialCount: number;
  initialDislikeCount: number;
  liked: boolean;
  disliked: boolean;
}

/** Hook optimiste gérant les likes, dislikes et leurs compteurs. */
export function useLike(postId: string, initialCount: number, initialDislikeCount = 0) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useInteractionState();
  const liked = data?.likedIds.includes(postId) ?? false;
  const disliked = data?.dislikedIds.includes(postId) ?? false;
  const key = ["interactions", user?.id ?? "guest"];
  const baselineMatches = Boolean(
    baseline && baseline.postId === postId &&
    baseline.userId === (user?.id ?? null) &&
    baseline.initialCount === initialCount &&
    baseline.initialDislikeCount === initialDislikeCount
  );
  const [baseline, setBaseline] = useState<LikeBaseline | null>(null);

  useEffect(() => {
    if (user && !data) return;
    setBaseline((current) => {
      if (
        current?.postId === postId &&
        current.userId === (user?.id ?? null) &&
        current.initialCount === initialCount &&
        current.initialDislikeCount === initialDislikeCount
      ) return current;
      return { postId, userId: user?.id ?? null, initialCount, initialDislikeCount, liked, disliked };
    });
  }, [data, user, postId, initialCount, initialDislikeCount, liked, disliked]);

  const isReady = !user || Boolean(data && baselineMatches);
  const baselineLiked = baselineMatches ? baseline.liked : liked;
  const baselineDisliked = baselineMatches ? baseline.disliked : disliked;

  const likeMut = useMutation({
    mutationFn: () => interactionsService.toggleLike(user!.id, postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InteractionState>(key);
      qc.setQueryData<InteractionState>(key, (old) => {
        const base = old ?? EMPTY_STATE;
        const has = base.likedIds.includes(postId);
        return {
          ...base,
          likedIds: has ? base.likedIds.filter((id) => id !== postId) : [...base.likedIds, postId],
          dislikedIds: has ? base.dislikedIds : base.dislikedIds.filter((id) => id !== postId),
        };
      });
      return { prev };
    },
    onError: (_error, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Impossible d'enregistrer votre réaction.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const dislikeMut = useMutation({
    mutationFn: () => interactionsService.toggleDislike(user!.id, postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InteractionState>(key);
      qc.setQueryData<InteractionState>(key, (old) => {
        const base = old ?? EMPTY_STATE;
        const has = base.dislikedIds.includes(postId);
        return {
          ...base,
          dislikedIds: has ? base.dislikedIds.filter((id) => id !== postId) : [...base.dislikedIds, postId],
          likedIds: has ? base.likedIds : base.likedIds.filter((id) => id !== postId),
        };
      });
      return { prev };
    },
    onError: (_error, _variables, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Impossible d'enregistrer votre réaction.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const guard = (fn: () => void) => {
    if (!user) {
      openAuthPopup();
      return;
    }
    if (!isReady) {
      toast.info("Chargement de vos interactions…");
      return;
    }
    fn();
  };

  return {
    liked,
    disliked,
    count: initialCount + Number(liked) - Number(baselineLiked),
    dislikeCount: initialDislikeCount + Number(disliked) - Number(baselineDisliked),
    toggle: () => guard(() => !likeMut.isPending && likeMut.mutate()),
    toggleDislike: () => guard(() => !dislikeMut.isPending && dislikeMut.mutate()),
  };
}
