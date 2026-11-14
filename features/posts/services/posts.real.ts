import { apiUrl } from "@/lib/env";
import type { PostStatus } from "@/types";
import type { FeedPage, FeedQuery, PostRecord, PostSummary, PostsService } from "../types/posts.types";

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } };
    return data?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** Laisse remonter les erreurs serveur au cache de requêtes au lieu de les transformer en listes vides. */
async function throwRequestError(res: Response, fallback: string): Promise<never> {
  throw new Error(await readErrorMessage(res, fallback));
}

/** Implémentation réelle du service des textes via les routes API Next.js. */
export const postsReal: PostsService = {
  async listFeed(query: FeedQuery): Promise<FeedPage> {
    const params = new URLSearchParams();
    if (query.themeSlug) params.set("theme", query.themeSlug);
    if (query.tagSlug) params.set("tag", query.tagSlug);
    if (query.authorUsername) params.set("author", query.authorUsername);
    if (query.sort) params.set("sort", query.sort);
    if (query.cursor) params.set("cursor", query.cursor);
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    const res = await fetch(apiUrl(`/api/posts?${params.toString()}`));
    if (!res.ok) return throwRequestError(res, "Impossible de charger les publications.");
    return (await res.json()) as FeedPage;
  },
  async getBySlug(slug: string): Promise<PostRecord | null> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(slug)}`));
    if (res.status === 404) return null;
    if (!res.ok) return throwRequestError(res, "Impossible de charger ce texte.");
    const data = (await res.json()) as { post: PostRecord | null };
    return data.post;
  },
  async getById(id: string): Promise<PostRecord | null> {
    const res = await fetch(apiUrl(`/api/posts/by-id/${encodeURIComponent(id)}`));
    if (res.status === 404) return null;
    if (!res.ok) return throwRequestError(res, "Impossible de charger ce texte.");
    const data = (await res.json()) as { post: PostRecord | null };
    return data.post;
  },
  async listRelated(post: PostRecord): Promise<PostSummary[]> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(post.id)}/related`));
    if (res.status === 404) return [];
    if (!res.ok) return throwRequestError(res, "Impossible de charger les textes similaires.");
    const data = (await res.json()) as { items: PostSummary[] };
    return data.items;
  },
  async listDrafts(): Promise<PostSummary[]> {
    const res = await fetch(apiUrl("/api/studio/drafts"));
    if (!res.ok) return throwRequestError(res, "Impossible de charger les brouillons.");
    const data = (await res.json()) as { drafts: PostSummary[] };
    return data.drafts;
  },
  async upsertDraft(draft: Partial<PostRecord> & { authorId: string }): Promise<PostRecord> {
    const res = await fetch(apiUrl("/api/studio/drafts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) return throwRequestError(res, "Impossible de sauvegarder le brouillon.");
    const data = (await res.json()) as { draft: PostRecord };
    return data.draft;
  },
  async publishPost(id: string): Promise<PostRecord | null> {
    const res = await fetch(apiUrl(`/api/studio/publish/${encodeURIComponent(id)}`), { method: "POST" });
    if (!res.ok) return throwRequestError(res, "Publication impossible.");
    const data = (await res.json()) as { post: PostRecord | null };
    return data.post;
  },
  async deletePost(id: string): Promise<boolean> {
    const res = await fetch(apiUrl(`/api/studio/drafts/${encodeURIComponent(id)}`), { method: "DELETE" });
    if (res.status === 404) return false;
    if (!res.ok) return throwRequestError(res, "Impossible de supprimer le texte.");
    return true;
  },
  async setModerationStatus(id: string, status: PostStatus, locked: boolean): Promise<void> {
    const res = await fetch(apiUrl(`/api/admin/posts/${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, locked }),
    });
    if (!res.ok) return throwRequestError(res, "Impossible de mettre à jour le texte.");
  },
  async adjustCounter(): Promise<void> {
    return;
  },
};
