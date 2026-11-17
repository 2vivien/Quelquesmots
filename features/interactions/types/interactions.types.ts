/** État des interactions de l'utilisateur courant sur les textes et auteurs. */
export interface InteractionState {
  likedIds: string[];
  dislikedIds: string[];
  bookmarkedIds: string[];
  blockedUserIds: string[];
  followedUserIds: string[];
}

/** Contrat du service d'interactions sociales. */
export interface InteractionsService {
  getUserState(userId: string): Promise<InteractionState>;
  toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likeCount: number; dislikeCount: number }>;
  toggleDislike(userId: string, postId: string): Promise<{ disliked: boolean; likeCount: number; dislikeCount: number }>;
  toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }>;
  recordView(postId: string): Promise<boolean>;
  toggleBlockUser(blockerId: string, targetUserId: string): Promise<{ blocked: boolean }>;
  toggleFollow(followerId: string, targetUserId: string): Promise<{ following: boolean }>;
}
