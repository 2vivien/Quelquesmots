import { postsService } from "@/features/posts";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/ratelimit";
import type { CommentItemData, CommentsService } from "../types/comments.types";

const runtimeComments: CommentItemData[] = [
  {
    id: "com-1",
    postId: "post-1",
    authorId: "user-une",
    authorUsername: "une.plume",
    authorAvatarUrl: "/images/editorial/avatar-une.jpg",
    parentId: null,
    body: "Cette image de la chambre calme est d'une justesse rare. Merci pour ces mots.",
    status: "VISIBLE",
    createdAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: "com-2",
    postId: "post-1",
    authorId: "user-plume",
    authorUsername: "plume.libre",
    authorAvatarUrl: "/images/editorial/avatar-plume.jpg",
    parentId: "com-1",
    body: "Merci de tout cœur pour votre lecture attentive.",
    status: "VISIBLE",
    createdAt: new Date(Date.now() - 4 * 60_000).toISOString(),
  },
];

/** Implémentation mock du service de commentaires. */
export const commentsMock: CommentsService = {
  async listByPost(postId: string): Promise<CommentItemData[]> {
    return runtimeComments.filter(
      (c) => c.postId === postId && c.status === "VISIBLE",
    );
  },
  async addComment(input): Promise<CommentItemData> {
    if (!checkRateLimit(`comment:${input.authorId}`, 10, 600_000)) {
      throw new AppError("RATE_LIMITED", "Trop de commentaires envoyés.");
    }
    const created: CommentItemData = {
      id: `com-${Date.now()}`,
      ...input,
      status: "VISIBLE",
      createdAt: new Date().toISOString(),
    };
    runtimeComments.push(created);
    await postsService.adjustCounter(input.postId, "commentCount", 1);
    return created;
  },
  async hideComment(commentId: string): Promise<void> {
    const idx = runtimeComments.findIndex((c) => c.id === commentId);
    if (idx >= 0 && runtimeComments[idx]) {
      runtimeComments[idx] = { ...runtimeComments[idx], status: "HIDDEN_BY_AUTHOR" };
    }
  },
};
