"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { commentSchema } from "../schemas/comment.schema";
import { commentsService } from "../services/comments.service";

/**
 * Hook gérant la liste et l'ajout de commentaires pour un texte.
 * @param postId Identifiant du texte.
 * @returns Commentaires, état de chargement et mutations.
 */
export function useComments(postId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => commentsService.listByPost(postId),
  });

  const addMutation = useMutation({
    mutationFn: async (input: { body: string; parentId: string | null }) => {
      if (!user) throw new Error("Connexion requise.");
      const parsed = commentSchema.safeParse({ body: input.body });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalide.");
      return commentsService.addComment({
        postId,
        authorId: user.id,
        authorUsername: user.username,
        authorAvatarUrl: user.avatarUrl,
        parentId: input.parentId,
        body: parsed.data.body,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Commentaire publié");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const hideMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.hideComment(commentId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["comments", postId] }),
  });

  return { comments: query.data ?? [], isLoading: query.isLoading, addMutation, hideMutation };
}
