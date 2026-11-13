import { apiUrl } from "@/lib/env";
import type { CommentItemData, CommentsService } from "../types/comments.types";

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
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { comment: CommentItemData };
    return data.comment;
  },
  async hideComment(commentId: string): Promise<void> {
    await fetch(apiUrl(`/api/comments/${encodeURIComponent(commentId)}/hide`), { method: "POST" });
  },
};
