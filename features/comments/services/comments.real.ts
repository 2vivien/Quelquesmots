import { apiUrl } from "@/lib/env";
import type { CommentItemData, CommentsService } from "../types/comments.types";

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } };
    return data?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** Implémentation réelle du service de commentaires via API. */
export const commentsReal: CommentsService = {
  async listByPost(postId: string): Promise<CommentItemData[]> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(postId)}/comments`));
    if (!res.ok) return [];
    const data = (await res.json()) as { comments: CommentItemData[] };
    return data.comments;
  },
  async addComment(input): Promise<CommentItemData> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(input.postId)}/comments`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Le serveur dérive l'auteur depuis la session ; ces champs sont ignorés.
      body: JSON.stringify({ body: input.body, parentId: input.parentId }),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, "Impossible de publier le commentaire."));
    }
    const data = (await res.json()) as { comment: CommentItemData };
    return data.comment;
  },
  async hideComment(commentId: string): Promise<void> {
    const res = await fetch(apiUrl(`/api/comments/${encodeURIComponent(commentId)}/hide`), { method: "POST" });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, "Impossible de masquer le commentaire."));
    }
  },
  async likeComment(commentId: string): Promise<{ liked: boolean; likeCount: number }> {
    const res = await fetch(apiUrl(`/api/comments/${encodeURIComponent(commentId)}/like`), { method: "POST" });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, "Impossible d'enregistrer votre réaction."));
    }
    return (await res.json()) as { liked: boolean; likeCount: number };
  },
};
