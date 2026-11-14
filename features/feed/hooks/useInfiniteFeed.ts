"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { useInteractionState } from "@/features/interactions";
import { postsService, type FeedPage } from "@/features/posts";

interface UseInfiniteFeedParams {
  themeId?: string;
  tagId?: string;
  authorId?: string;
  sort?: "recent" | "top";
  initialPage?: FeedPage;
}

/**
 * Hook de chargement paginé par curseur du flux de textes.
 * @param params Filtres actifs et première page rendue côté serveur.
 * @returns Liste aplatie des textes et contrôles de pagination.
 */
export function useInfiniteFeed(params: UseInfiniteFeedParams) {
  const { user } = useAuth();
  const { data: interaction } = useInteractionState();
  const blocked = interaction?.blockedUserIds ?? [];

  const query = useInfiniteQuery({
    queryKey: [
      "feed",
      params.themeId ?? "",
      params.tagId ?? "",
      params.authorId ?? "",
      params.sort ?? "recent",
      user?.id ?? "guest",
      blocked,
    ],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      postsService.listFeed({
        themeId: params.themeId,
        tagId: params.tagId,
        authorId: params.authorId,
        sort: params.sort,
        cursor: pageParam,
        limit: 10,
        viewerId: user?.id ?? null,
        blockedAuthorIds: blocked,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: params.initialPage && !user
      ? { pages: [params.initialPage], pageParams: [null] }
      : undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];
  return { ...query, posts };
}
