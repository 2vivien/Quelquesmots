/** Statut d'un commentaire. */
export type CommentStatus = "VISIBLE" | "HIDDEN_BY_AUTHOR" | "HIDDEN_BY_MOD" | "DELETED";

/** Enregistrement d'un commentaire sur un texte. */
export interface CommentItemData {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string;
  parentId: string | null;
  body: string;
  status: CommentStatus;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
}

/** Contrat du service de commentaires. */
export interface CommentsService {
  listByPost(postId: string): Promise<CommentItemData[]>;
  addComment(input: {
    postId: string;
    authorId: string;
    authorUsername: string;
    authorAvatarUrl: string;
    parentId: string | null;
    body: string;
  }): Promise<CommentItemData>;
  hideComment(commentId: string): Promise<void>;
  likeComment(commentId: string): Promise<{ liked: boolean; likeCount: number }>;
}
