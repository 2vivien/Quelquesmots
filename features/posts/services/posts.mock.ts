import { normalizeSearchText } from "@/lib/format";
import type { PostStatus } from "@/types";
import type { FeedPage, FeedQuery, PostRecord, PostsService } from "../types/posts.types";
import { canViewPost } from "../utils/visibility";
import { MOCK_POSTS } from "./posts.mock-data";

const runtimePosts = [...MOCK_POSTS];

function toSlug(title: string, id: string): string {
  const base = normalizeSearchText(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "texte"}-${id.slice(-4)}`;
}

/** Implémentation mock du service des textes avec persistance en mémoire. */
export const postsMock: PostsService = {
  async listFeed(query: FeedQuery): Promise<FeedPage> {
    const blocked = new Set(query.blockedAuthorIds ?? []);
    const filtered = runtimePosts
      .filter((p) => p.status === "PUBLISHED" && canViewPost(p, query.viewerId))
      .filter((p) => !blocked.has(p.authorId))
      .filter((p) => !query.themeSlug || p.themeSlugs.includes(query.themeSlug))
      .filter((p) => !query.tagSlug || p.tagSlugs.includes(query.tagSlug))
      .filter((p) => !query.authorUsername || normalizeSearchText(p.authorUsername) === normalizeSearchText(query.authorUsername));
    const sorted = [...filtered].sort((a, b) =>
      query.sort === "top" ? b.likeCount - a.likeCount : (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    );
    const start = query.cursor ? Math.max(0, sorted.findIndex((p) => p.id === query.cursor) + 1) : 0;
    const limit = query.limit ?? 20;
    const slice = sorted.slice(start, start + limit);
    const nextCursor = start + limit < sorted.length ? (slice.at(-1)?.id ?? null) : null;
    return { items: slice, nextCursor };
  },
  async getBySlug(slug: string, viewerId?: string | null): Promise<PostRecord | null> {
    const found = runtimePosts.find((p) => p.slug === slug);
    return found && canViewPost(found, viewerId) ? found : null;
  },
  async getById(id: string): Promise<PostRecord | null> {
    return runtimePosts.find((p) => p.id === id) ?? null;
  },
  async listRelated(post: PostRecord, viewerId?: string | null): Promise<PostRecord[]> {
    return runtimePosts
      .filter((p) => p.id !== post.id && p.status === "PUBLISHED" && canViewPost(p, viewerId))
      .filter((p) => p.themeSlugs.some((t) => post.themeSlugs.includes(t)))
      .slice(0, 3);
  },
  async listDrafts(authorId: string): Promise<PostRecord[]> {
    return runtimePosts
      .filter((p) => p.authorId === authorId && p.status === "DRAFT")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async upsertDraft(draft: Partial<PostRecord> & { authorId: string }): Promise<PostRecord> {
    const idx = draft.id ? runtimePosts.findIndex((p) => p.id === draft.id && p.authorId === draft.authorId) : -1;
    if (idx >= 0 && runtimePosts[idx]) {
      const updated = { ...runtimePosts[idx], ...draft, updatedAt: new Date().toISOString() };
      runtimePosts[idx] = updated;
      return updated;
    }
    const id = draft.id ?? `draft-${Date.now()}`;
    const created: PostRecord = {
      id,
      slug: "",
      title: draft.title ?? "Sans titre",
      excerpt: draft.excerpt ?? "",
      contentJson: draft.contentJson ?? { type: "doc", content: [{ type: "paragraph" }] },
      contentText: draft.contentText ?? "",
      authorId: draft.authorId,
      authorUsername: draft.authorUsername ?? "em.mots",
      authorFirstName: draft.authorFirstName,
      authorLastName: draft.authorLastName,
      authorAvatarUrl: draft.authorAvatarUrl ?? "/images/editorial/avatar-emma.jpg",
      publishAs: draft.publishAs ?? "USERNAME",
      visibility: draft.visibility ?? "PUBLIC",
      status: "DRAFT",
      themeSlugs: draft.themeSlugs ?? ["vie"],
      tagSlugs: draft.tagSlugs ?? [],
      heroImageUrl: draft.heroImageUrl ?? "/images/editorial/hero-lecture.jpg",
      commentsEnabled: draft.commentsEnabled ?? true,
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      moderationLocked: false,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    };
    runtimePosts.unshift(created);
    return created;
  },
  async publishPost(id: string, authorId: string): Promise<PostRecord | null> {
    const idx = runtimePosts.findIndex((p) => p.id === id && p.authorId === authorId);
    if (idx < 0 || !runtimePosts[idx]) return null;
    const target = runtimePosts[idx];
    const now = new Date().toISOString();
    const published: PostRecord = {
      ...target,
      status: target.moderationLocked ? "UNDER_REVIEW" : "PUBLISHED",
      slug: target.slug || toSlug(target.title, target.id),
      publishedAt: target.publishedAt ?? now,
      updatedAt: now,
    };
    runtimePosts[idx] = published;
    return published;
  },
  async deletePost(id: string, authorId: string): Promise<boolean> {
    const idx = runtimePosts.findIndex((p) => p.id === id && p.authorId === authorId);
    if (idx < 0 || !runtimePosts[idx]) return false;
    runtimePosts[idx] = { ...runtimePosts[idx], status: "DELETED" };
    return true;
  },
  async setModerationStatus(id: string, status: PostStatus, locked: boolean): Promise<void> {
    const idx = runtimePosts.findIndex((p) => p.id === id);
    if (idx >= 0 && runtimePosts[idx]) {
      runtimePosts[idx] = { ...runtimePosts[idx], status, moderationLocked: locked };
    }
  },
  async adjustCounter(id: string, field: "likeCount" | "dislikeCount" | "commentCount" | "bookmarkCount" | "viewCount", delta: number): Promise<void> {
    const idx = runtimePosts.findIndex((p) => p.id === id);
    if (idx >= 0 && runtimePosts[idx]) {
      const current = runtimePosts[idx][field];
      runtimePosts[idx] = { ...runtimePosts[idx], [field]: Math.max(0, current + delta) };
    }
  },
};
