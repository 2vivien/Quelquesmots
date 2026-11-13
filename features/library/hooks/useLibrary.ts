"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { useInteractionState } from "@/features/interactions";
import { postsService } from "@/features/posts";

/**
 * Hook gérant les brouillons de l'auteur et ses textes enregistrés en bibliothèque.
 * @returns Listes des brouillons, des favoris et action de suppression de brouillon.
 */
export function useLibrary() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: interactions } = useInteractionState();

  const draftsQuery = useQuery({
    queryKey: ["library", "drafts", user?.id ?? "guest"],
    queryFn: () => (user ? postsService.listDrafts(user.id) : Promise.resolve([])),
  });

  const bookmarksQuery = useQuery({
    queryKey: ["library", "bookmarks", interactions?.bookmarkedIds ?? []],
    queryFn: async () => {
      const ids = interactions?.bookmarkedIds ?? [];
      const resolved = await Promise.all(ids.map((id) => postsService.getById(id)));
      return resolved.filter((p): p is NonNullable<typeof p> => p !== null);
    },
  });

  const deleteDraft = useMutation({
    mutationFn: (id: string) =>
      user ? postsService.deletePost(id, user.id) : Promise.resolve(false),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["library", "drafts"] });
      toast.success("Brouillon supprimé");
    },
  });

  return {
    drafts: draftsQuery.data ?? [],
    bookmarks: bookmarksQuery.data ?? [],
    isLoading: draftsQuery.isLoading,
    deleteDraft,
  };
}
