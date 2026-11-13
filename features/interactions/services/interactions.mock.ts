import { postsService } from "@/features/posts";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/ratelimit";
import type { InteractionState, InteractionsService } from "../types/interactions.types";

const likedByUser = new Map<string, Set<string>>();
const dislikedByUser = new Map<string, Set<string>>();
const bookmarkedByUser = new Map<string, Set<string>>([["user-emma", new Set(["post-1", "post-2"])]]);
const blockedByUser = new Map<string, Set<string>>();
const followedByUser = new Map<string, Set<string>>([["user-emma", new Set(["user-plume"])]]);
const seenViews = new Set<string>();

function getSet(map: Map<string, Set<string>>, key: string): Set<string> {
  const existing = map.get(key);
  if (existing) return existing;
  const created = new Set<string>();
  map.set(key, created);
  return created;
}

/** Implémentation mock des interactions avec anti-doublon et limitation de débit. */
export const interactionsMock: InteractionsService = {
  async getUserState(userId: string): Promise<InteractionState> {
    return {
      likedIds: Array.from(getSet(likedByUser, userId)),
      dislikedIds: Array.from(getSet(dislikedByUser, userId)),
      bookmarkedIds: Array.from(getSet(bookmarkedByUser, userId)),
      blockedUserIds: Array.from(getSet(blockedByUser, userId)),
      followedUserIds: Array.from(getSet(followedByUser, userId)),
    };
  },
  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean }> {
    if (!checkRateLimit(`like:${userId}`, 60, 60_000)) throw new AppError("RATE_LIMITED", "Trop de réactions en une minute.");
    const likes = getSet(likedByUser, userId);
    const dislikes = getSet(dislikedByUser, userId);
    const liked = !likes.has(postId);
    if (liked) {
      likes.add(postId);
      if (dislikes.delete(postId)) await postsService.adjustCounter(postId, "dislikeCount", -1);
    } else likes.delete(postId);
    await postsService.adjustCounter(postId, "likeCount", liked ? 1 : -1);
    return { liked };
  },
  async toggleDislike(userId: string, postId: string): Promise<{ disliked: boolean }> {
    const dislikes = getSet(dislikedByUser, userId);
    const likes = getSet(likedByUser, userId);
    const disliked = !dislikes.has(postId);
    if (disliked) {
      dislikes.add(postId);
      if (likes.delete(postId)) await postsService.adjustCounter(postId, "likeCount", -1);
    } else dislikes.delete(postId);
    await postsService.adjustCounter(postId, "dislikeCount", disliked ? 1 : -1);
    return { disliked };
  },
  async toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
    const set = getSet(bookmarkedByUser, userId);
    const bookmarked = !set.has(postId);
    if (bookmarked) set.add(postId); else set.delete(postId);
    await postsService.adjustCounter(postId, "bookmarkCount", bookmarked ? 1 : -1);
    return { bookmarked };
  },
  async recordView(postId: string, viewerKey: string): Promise<boolean> {
    const key = `${postId}:${viewerKey}:${new Date().toISOString().slice(0, 10)}`;
    if (seenViews.has(key)) return false;
    seenViews.add(key);
    await postsService.adjustCounter(postId, "viewCount", 1);
    return true;
  },
  async toggleBlockUser(blockerId: string, targetUserId: string): Promise<{ blocked: boolean }> {
    const set = getSet(blockedByUser, blockerId);
    const blocked = !set.has(targetUserId);
    if (blocked) set.add(targetUserId); else set.delete(targetUserId);
    return { blocked };
  },
  async toggleFollow(followerId: string, targetUserId: string): Promise<{ following: boolean }> {
    const set = getSet(followedByUser, followerId);
    const following = !set.has(targetUserId);
    if (following) set.add(targetUserId); else set.delete(targetUserId);
    return { following };
  },
};
