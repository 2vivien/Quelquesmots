"use client";

import { useRef } from "react";
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
  ready: boolean;
}

/** Hook optimiste gérant les likes, dislikes et leurs compteurs. */
export function useLike(postId: string, initialCount: number, initialDislikeCount = 0) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useInteractionState();
  const liked = data?.likedIds.includes(postId) ?? false;
  const disliked = data?.dislikedIds.includes(postId) ?? false;
  const key = ["interactions", user?.id ?? "guest"];
  const baseline = useRef<LikeBaseline>({
    postId,
    userId: user?.id ?? null,
    initialCount,
    initialDislikeCount,
    liked,
    disliked,
    ready: !user || Boolean(data),
  });

  const contextChanged =
    baseline.current.postId !== postId ||
    baseline.current.userId !== (user?.id ?? null) ||
    baseline.current.initialCount !== initialCount ||
    baseline.current.initialDislikeCount !== initialDislikeCount;

  if (contextChanged) {
    baseline.current = {
      postId,
      userId: user?.id ?? null,
      initialCount,
      initialDislikeCount,
      liked,
      disliked,
      ready: !user || Boolean(data),
    };
  } else if (user && data && !baseline.current.ready) {
    baseline.current = { ...baseline.current, liked, disliked, ready: true };
  }

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
    if (!baseline.current.ready) {
      toast.info("Chargement de vos interactions…");
      return;
    }
    fn();
  };

  return {
    liked,
    disliked,
    count: initialCount + Number(liked) - Number(baseline.current.liked),
    dislikeCount: initialDislikeCount + Number(disliked) - Number(baseline.current.disliked),
    toggle: () => guard(() => !likeMut.isPending && likeMut.mutate()),
    toggleDislike: () => guard(() => !dislikeMut.isPending && dislikeMut.mutate()),
  };
}
