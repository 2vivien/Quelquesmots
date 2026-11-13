import { apiUrl } from "@/lib/env";
import type { InteractionState, InteractionsService } from "../types/interactions.types";

/** Implémentation réelle du service d'interactions via API Next.js. */
export const interactionsReal: InteractionsService = {
  async getUserState(): Promise<InteractionState> {
    const res = await fetch(apiUrl("/api/interactions/state"));
    if (!res.ok) return { likedIds: [], dislikedIds: [], bookmarkedIds: [], blockedUserIds: [], followedUserIds: [] };
    return (await res.json()) as InteractionState;
  },
  async toggleLike(_userId: string, postId: string): Promise<{ liked: boolean }> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(postId)}/like`), { method: "POST" });
    return (await res.json()) as { liked: boolean };
  },
  async toggleDislike(_userId: string, postId: string): Promise<{ disliked: boolean }> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(postId)}/dislike`), { method: "POST" });
    return (await res.json()) as { disliked: boolean };
  },
  async toggleBookmark(_userId: string, postId: string): Promise<{ bookmarked: boolean }> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(postId)}/bookmark`), { method: "POST" });
    return (await res.json()) as { bookmarked: boolean };
  },
  async recordView(postId: string): Promise<boolean> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(postId)}/view`), { method: "POST" });
    return res.ok;
  },
  async toggleBlockUser(_blockerId: string, targetUserId: string): Promise<{ blocked: boolean }> {
    const res = await fetch(apiUrl(`/api/users/${encodeURIComponent(targetUserId)}/block`), { method: "POST" });
    return (await res.json()) as { blocked: boolean };
  },
  async toggleFollow(_followerId: string, targetUserId: string): Promise<{ following: boolean }> {
    const res = await fetch(apiUrl(`/api/users/${encodeURIComponent(targetUserId)}/follow`), { method: "POST" });
    return (await res.json()) as { following: boolean };
  },
};
