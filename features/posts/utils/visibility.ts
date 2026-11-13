import type { PostRecord } from "../types/posts.types";

/**
 * Règle métier unique déterminant si un lecteur peut consulter un texte.
 * @param post Enregistrement du texte.
 * @param viewerId Identifiant du lecteur connecté ou `null`.
 * @returns `true` si le texte est accessible.
 */
export function canViewPost(
  post: PostRecord,
  viewerId?: string | null,
): boolean {
  const isOwner = Boolean(viewerId && viewerId === post.authorId);
  if (post.status === "DELETED" || post.status === "HIDDEN") {
    return false;
  }
  if (post.status !== "PUBLISHED") {
    return isOwner;
  }
  if (post.visibility === "PRIVATE") {
    return isOwner;
  }
  return true;
}
