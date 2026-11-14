import type { PostStatus, PublishAs, TiptapDoc, Visibility } from "@/types";

/** Enregistrement complet d'un texte court ou brouillon. */
export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentJson: TiptapDoc;
  contentText: string;
  authorId: string;
  authorUsername: string;
  authorFirstName?: string;
  authorLastName?: string;
  authorAvatarUrl: string;
  publishAs: PublishAs;
  visibility: Visibility;
  status: PostStatus;
  themeSlugs: string[];
  tagSlugs: string[];
  heroImageUrl: string;
  commentsEnabled: boolean;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  bookmarkCount: number;
  moderationLocked: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

/** Résumé léger d'un texte (sans corps) — utilisé pour les listes et le fil. */
export type PostSummary = Omit<PostRecord, "contentJson" | "contentText">;

/** Critères de requête pour le mur et les listes paginées. */
export interface FeedQuery {
  themeSlug?: string;
  tagSlug?: string;
  authorUsername?: string;
  sort?: "recent" | "top";
  cursor?: string | null;
  limit?: number;
  viewerId?: string | null;
  blockedAuthorIds?: string[];
}

/** Page de résultats paginée par curseur. */
export interface FeedPage {
  items: PostSummary[];
  nextCursor: string | null;
}

/** Contrat du service des textes. */
export interface PostsService {
  listFeed(query: FeedQuery): Promise<FeedPage>;
  getBySlug(slug: string, viewerId?: string | null): Promise<PostRecord | null>;
  getById(id: string): Promise<PostRecord | null>;
  getByIds(ids: string[]): Promise<PostRecord[]>;
  listRelated(post: PostRecord, viewerId?: string | null): Promise<PostSummary[]>;
  listDrafts(authorId: string): Promise<PostSummary[]>;
  upsertDraft(draft: Partial<PostRecord> & { authorId: string }): Promise<PostRecord>;
  publishPost(id: string, authorId: string): Promise<PostRecord | null>;
  deletePost(id: string, authorId: string): Promise<boolean>;
  setModerationStatus(id: string, status: PostStatus, locked: boolean): Promise<void>;
  adjustCounter(id: string, field: "likeCount" | "dislikeCount" | "commentCount" | "bookmarkCount" | "viewCount", delta: number): Promise<void>;
}
