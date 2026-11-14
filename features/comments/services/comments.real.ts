import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { CommentItemData, CommentsService } from "../types/comments.types";

/** Implémentation réelle du service de commentaires via API. */
export const commentsReal: CommentsService = {
  async listByPost(postId: string): Promise<CommentItemData[]> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(postId)}/comments`));
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de charger les commentaires."));
    const data = (await res.json()) as { comments: CommentItemData[] };
    return data.comments;
  },
  async addComment(input): Promise<CommentItemData> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(input.postId)}/comments`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: input.body, parentId: input.parentId }),
    });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de publier le commentaire."));
    const data = (await res.json()) as { comment: CommentItemData };
    return data.comment;
  },
  async hideComment(commentId: string): Promise<void> {
    const res = await fetch(apiUrl(`/api/comments/${encodeURIComponent(commentId)}/hide`), { method: "POST" });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de masquer le commentaire."));
  },
  async likeComment(commentId: string): Promise<{ liked: boolean; likeCount: number }> {
    const res = await fetch(apiUrl(`/api/comments/${encodeURIComponent(commentId)}/like`), { method: "POST" });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible d'enregistrer votre réaction."));
    return (await res.json()) as { liked: boolean; likeCount: number };
  },
};
