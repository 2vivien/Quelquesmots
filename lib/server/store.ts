/**
 * Store mémoire réservé au développement et aux démonstrations locales.
 * Il survit aux rechargements HMR mais ne fournit aucune persistance multi-instance.
 * Les données seedées ne sont jamais chargées en production.
 */
import { createHash, randomUUID } from "node:crypto";
import type { AuthUser } from "@/features/auth";
import type { AuditEntry, SiteSettings } from "@/features/admin/types/admin.types";
import type { AuthorProfile } from "@/features/authors/types/authors.types";
import { SEED_AUTHORS } from "@/lib/server/seed/authors";
import type { CommentItemData } from "@/features/comments/types/comments.types";
import type { InteractionState } from "@/features/interactions/types/interactions.types";
import type { ReportItem, ReportReason, ReportTargetType } from "@/features/moderation/types/moderation.types";
import type { NotificationKind, NotificationItem } from "@/features/notifications/types/notifications.types";
import type { FeedPage, FeedQuery, PostRecord, PostSummary } from "@/features/posts/types/posts.types";
import { SEED_POSTS } from "@/lib/server/seed/posts";
import { canViewPost } from "@/features/posts/utils/visibility";
import type { TagItem } from "@/features/tags/types/tags.types";
import type { ThemeItem } from "@/features/themes/types/themes.types";
import { SEED_THEMES } from "@/lib/server/seed/themes";
import { formatCount, normalizeSearchText } from "@/lib/format";
import { isFuzzyMatch } from "@/features/search/utils/fuzzy";
import type { SearchResponse, SearchResultItem, SearchTab } from "@/features/search/types/search.types";
import type { PostStatus } from "@/types";

const EMMA_SEED: AuthUser = {
  id: "user-emma",
  username: "em.mots",
  firstName: "Emma",
  lastName: "Martin",
  bio: "Une lectrice, une rêveuse.",
  avatarUrl: "/images/editorial/avatar-emma.jpg",
  defaultPublishAs: "USERNAME",
  listedInDirectory: true,
  showJoinDate: true,
  role: "admin",
  onboarded: true,
};

const MOCK_TAGS: TagItem[] = [
  { slug: "amour", label: "amour", useCount: 1248, status: "APPROVED" },
  { slug: "vie", label: "vie", useCount: 980, status: "APPROVED" },
  { slug: "resilience", label: "résilience", useCount: 642, status: "APPROVED" },
  { slug: "solitude", label: "solitude", useCount: 720, status: "APPROVED" },
  { slug: "espoir", label: "espoir", useCount: 540, status: "APPROVED" },
  { slug: "souvenirs", label: "souvenirs", useCount: 495, status: "APPROVED" },
  { slug: "absence", label: "absence", useCount: 410, status: "APPROVED" },
  { slug: "memoire", label: "mémoire", useCount: 380, status: "APPROVED" },
  { slug: "litterature", label: "littérature", useCount: 310, status: "APPROVED" },
  { slug: "passion", label: "passion", useCount: 290, status: "APPROVED" },
  { slug: "relation", label: "relation", useCount: 245, status: "APPROVED" },
  { slug: "coeur", label: "cœur", useCount: 230, status: "APPROVED" },
];

const ago = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

// Zéro commentaire d'amorçage pour pouvoir démontrer les likes.
const SEED_COMMENT_LIKES: Record<string, string[]> = {
  "com-1": ["user-emma", "user-plume"],
  "com-2": ["user-une"],
};

const SEED_COMMENTS: CommentItemData[] = [
  {
    id: "com-1",
    postId: "post-1",
    authorId: "user-une",
    authorUsername: "une.plume",
    authorAvatarUrl: "/images/editorial/avatar-une.jpg",
    parentId: null,
    body: "Cette image de la chambre calme est d'une justesse rare. Merci pour ces mots.",
    status: "VISIBLE",
    createdAt: ago(8),
    likeCount: 0,
    likedByMe: false,
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
    createdAt: ago(4),
    likeCount: 0,
    likedByMe: false,
  },
];

const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif-1", userId: "user-emma", type: "LIKE", actorUsername: "plume.libre", actorAvatarUrl: "/images/editorial/avatar-plume.jpg", postTitle: "Les rues où l'on se croise.", postId: "post-6", postSlug: "les-rues-ou-l-on-se-croise", read: false, createdAt: ago(2) },
  { id: "notif-2", userId: "user-emma", type: "COMMENT", actorUsername: "une.plume", actorAvatarUrl: "/images/editorial/avatar-une.jpg", postTitle: "Les rues où l'on se croise.", postId: "post-6", postSlug: "les-rues-ou-l-on-se-croise", read: false, createdAt: ago(12) },
  { id: "notif-3", userId: "user-emma", type: "SHARE", actorUsername: "lise.mots", actorAvatarUrl: "/images/editorial/avatar-emma.jpg", postTitle: "Les rues où l'on se croise.", postId: "post-6", postSlug: "les-rues-ou-l-on-se-croise", read: true, createdAt: ago(60) },
];

const SEED_REPORTS: ReportItem[] = [
  {
    id: "rep-1",
    reporterId: "user-une",
    targetType: "POST",
    targetId: "post-6",
    targetLabel: "Les rues où l'on se croise.",
    reason: "OTHER",
    details: "Vérification éditoriale demandée.",
    priority: 0,
    status: "OPEN",
    createdAt: ago(60),
  },
];

interface Db {
  posts: PostRecord[];
  themes: ThemeItem[];
  tags: TagItem[];
  comments: CommentItemData[];
  notifications: NotificationItem[];
  reports: ReportItem[];
  audit: AuditEntry[];
  settings: SiteSettings;
  users: AuthUser[];
  authors: AuthorProfile[];
  likes: Map<string, Set<string>>;
  dislikes: Map<string, Set<string>>;
  bookmarks: Map<string, Set<string>>;
  follows: Map<string, Set<string>>;
  blocks: Map<string, Set<string>>;
  commentLikes: Map<string, Set<string>>;
  recentViews: Map<string, number>;
  publishedToday: Map<string, { date: string; count: number }>;
}

function seedUsers(): AuthUser[] {
  const writers = SEED_AUTHORS.filter((a) => a.userId !== EMMA_SEED.id).map(
    (a): AuthUser => ({
      id: a.userId,
      username: a.username,
      firstName: a.firstName ?? "",
      lastName: a.lastName ?? "",
      bio: a.bio,
      avatarUrl: a.avatarUrl,
      defaultPublishAs: a.defaultPublishAs,
      listedInDirectory: a.listedInDirectory,
      showJoinDate: a.showJoinDate,
      role: "user",
      onboarded: true,
    }),
  );
  return [EMMA_SEED, ...writers];
}

function seedDb(): Db {
  const demoMode = process.env.NODE_ENV !== "production";
  const bookmarks = new Map<string, Set<string>>();
  const follows = new Map<string, Set<string>>();
  if (demoMode) {
    bookmarks.set("user-emma", new Set(["post-1", "post-2"]));
    follows.set("user-emma", new Set(["user-plume"]));
  }
  return {
    posts: demoMode ? SEED_POSTS.map((p) => ({ ...p })) : [],
    themes: demoMode ? SEED_THEMES.map((t) => ({ ...t })) : [],
    tags: demoMode ? MOCK_TAGS.map((t) => ({ ...t })) : [],
    commentLikes: demoMode
      ? new Map(Object.entries(SEED_COMMENT_LIKES).map(([id, users]) => [id, new Set(users)]))
      : new Map(),
    comments: demoMode ? SEED_COMMENTS.map((c) => ({ ...c })) : [],
    notifications: demoMode ? SEED_NOTIFICATIONS.map((n) => ({ ...n })) : [],
    reports: demoMode ? SEED_REPORTS.map((r) => ({ ...r })) : [],
    audit: [],
    settings: { maxChars: 50000, minChars: 20, maxTags: 5, dailyPublishLimit: 10 },
    users: demoMode ? seedUsers() : [],
    authors: demoMode ? SEED_AUTHORS.map((a) => ({ ...a })) : [],
    likes: new Map(),
    dislikes: new Map(),
    bookmarks,
    follows,
    blocks: new Map(),
    recentViews: new Map(),
    publishedToday: new Map(),
  };
}

const globalRef = globalThis as typeof globalThis & { __qmStore?: Db };

/** Instance unique du store, créée au premier accès. */
export function getDb(): Db {
  if (!globalRef.__qmStore) globalRef.__qmStore = seedDb();
  return globalRef.__qmStore;
}

const newId = (prefix: string): string => `${prefix}-${randomUUID()}`;
const today = (): string => new Date().toISOString().slice(0, 10);

/** Retire le corps d'un texte pour les listes (excerpt suffit pour un fil). */
function stripPostContent(post: PostRecord): PostSummary {
  const summary = { ...post } as Record<string, unknown>;
  delete summary.contentJson;
  delete summary.contentText;
  return summary as unknown as PostSummary;
}

function getSet(map: Map<string, Set<string>>, key: string): Set<string> {
  const existing = map.get(key);
  if (existing) return existing;
  const created = new Set<string>();
  map.set(key, created);
  return created;
}

/* ---------------------------------- Utilisateurs ---------------------------------- */

export function findUserById(id: string): AuthUser | null {
  return getDb().users.find((u) => u.id === id) ?? null;
}

export function findUserByUsername(username: string): AuthUser | null {
  const target = normalizeSearchText(username);
  return getDb().users.find((u) => normalizeSearchText(u.username) === target) ?? null;
}

export function isUsernameAvailable(username: string, exceptUserId?: string): boolean {
  const target = normalizeSearchText(username.trim());
  if (!target) return false;
  return !getDb().users.some(
    (u) => normalizeSearchText(u.username) === target && u.id !== exceptUserId,
  );
}

/** Crée un compte de démonstration (mode sans identifiants Google). */
export function createDemoUser(): AuthUser {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Les comptes de démonstration sont désactivés en production.");
  }
  const db = getDb();
  const user: AuthUser = {
    id: `user-${randomUUID().slice(0, 8)}`,
    username: `lecteur-${randomUUID().slice(0, 6)}`,
    firstName: "",
    lastName: "",
    bio: "",
    avatarUrl: "/images/editorial/avatar-emma.jpg",
    defaultPublishAs: "USERNAME",
    listedInDirectory: true,
    showJoinDate: true,
    role: "user",
    onboarded: false,
  };
  db.users.push(user);
  return user;
}

export function updateUserProfile(
  userId: string,
  patch: Partial<Pick<AuthUser, "firstName" | "lastName" | "username" | "bio" | "defaultPublishAs" | "listedInDirectory" | "showJoinDate" | "onboarded" | "avatarUrl">>,
): AuthUser | null {
  const db = getDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0 || !db.users[idx]) return null;
  const updated: AuthUser = { ...db.users[idx], ...patch };
  db.users[idx] = updated;
  // Synchronise le profil auteur exposé dans l'annuaire.
  const authorIdx = db.authors.findIndex((a) => a.userId === userId);
  const authorPatch = {
    userId,
    username: updated.username,
    firstName: updated.firstName || undefined,
    lastName: updated.lastName || undefined,
    bio: updated.bio,
    avatarUrl: updated.avatarUrl,
    defaultPublishAs: updated.defaultPublishAs,
    listedInDirectory: updated.listedInDirectory,
    showJoinDate: updated.showJoinDate,
  };
  if (authorIdx >= 0 && db.authors[authorIdx]) {
    db.authors[authorIdx] = { ...db.authors[authorIdx], ...authorPatch };
  } else {
    db.authors.push({
      ...authorPatch,
      postCount: 0,
      followersCount: 0,
      joinedAt: new Date().toISOString(),
      status: "ACTIVE",
    });
  }
  return updated;
}

/* ----------------------------------- Textes ----------------------------------- */

export function listFeed(query: FeedQuery): FeedPage {
  const db = getDb();
  const blocked = new Set(query.blockedAuthorIds ?? []);
  const filtered = db.posts
    .filter((p) => p.status === "PUBLISHED" && canViewPost(p, query.viewerId))
    .filter((p) => !blocked.has(p.authorId))
    .filter((p) => !query.themeSlug || p.themeSlugs.includes(query.themeSlug))
    .filter((p) => !query.tagSlug || p.tagSlugs.includes(query.tagSlug))
    .filter(
      (p) =>
        !query.authorUsername ||
        normalizeSearchText(p.authorUsername) === normalizeSearchText(query.authorUsername),
    );
  const sorted = [...filtered].sort((a, b) =>
    query.sort === "top"
      ? popularityScore(b) - popularityScore(a)
      : (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
  );
  const start = query.cursor
    ? Math.max(0, sorted.findIndex((p) => p.id === query.cursor) + 1)
    : 0;
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const slice = sorted.slice(start, start + limit);
  const nextCursor =
    start + limit < sorted.length ? (slice.at(-1)?.id ?? null) : null;
  return { items: slice.map(stripPostContent), nextCursor };
}

export function getPostBySlug(slug: string, viewerId?: string | null): PostRecord | null {
  const found = getDb().posts.find((p) => p.slug === slug);
  return found && canViewPost(found, viewerId) ? found : null;
}

export function getPostById(id: string): PostRecord | null {
  return getDb().posts.find((p) => p.id === id) ?? null;
}

/** Charge plusieurs publications visibles en une seule lecture logique. */
export function getPostsByIds(ids: string[], viewerId?: string | null): PostSummary[] {
  const requested = new Set(ids);
  const found = new Map(
    getDb().posts
      .filter((post) => requested.has(post.id) && canViewPost(post, viewerId))
      .map((post) => [post.id, post] as const),
  );
  return ids.flatMap((id) => {
    const post = found.get(id);
    return post ? [stripPostContent(post)] : [];
  });
}

export function listRelated(post: PostRecord, viewerId?: string | null): PostSummary[] {
  return getDb()
    .posts.filter(
      (p) => p.id !== post.id && p.status === "PUBLISHED" && canViewPost(p, viewerId),
    )
    .filter((p) => p.themeSlugs.some((t) => post.themeSlugs.includes(t)))
    .slice(0, 3)
    .map(stripPostContent);
}

export function listDrafts(authorId: string): PostSummary[] {
  return getDb()
    .posts.filter((p) => p.authorId === authorId && p.status === "DRAFT")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(stripPostContent);
}

function toSlug(title: string, id: string): string {
  const base = normalizeSearchText(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "texte"}-${id.slice(-4)}`;
}

export function upsertDraft(
  draft: Partial<PostRecord> & { authorId: string },
): PostRecord | null {
  const db = getDb();
  const idx = draft.id
    ? db.posts.findIndex(
        (p) => p.id === draft.id && p.authorId === draft.authorId && p.status === "DRAFT",
      )
    : -1;
  if (draft.id && idx < 0) return null; // Brouillon introuvable ou déjà publié.
  if (idx >= 0 && db.posts[idx]) {
    const updated: PostRecord = {
      ...db.posts[idx],
      ...draft,
      id: db.posts[idx].id,
      authorId: db.posts[idx].authorId,
      status: "DRAFT",
      updatedAt: new Date().toISOString(),
    };
    db.posts[idx] = updated;
    return updated;
  }
  const id = newId("draft");
  const author = findUserById(draft.authorId);
  const created: PostRecord = {
    id,
    slug: "",
    title: draft.title ?? "Sans titre",
    excerpt: draft.excerpt ?? "",
    contentJson: draft.contentJson ?? { type: "doc", content: [{ type: "paragraph" }] },
    contentText: draft.contentText ?? "",
    authorId: draft.authorId,
    authorUsername: draft.authorUsername ?? author?.username ?? "inconnu",
    authorFirstName: draft.authorFirstName ?? author?.firstName,
    authorLastName: draft.authorLastName ?? author?.lastName,
    authorAvatarUrl: draft.authorAvatarUrl ?? author?.avatarUrl ?? "/images/editorial/avatar-emma.jpg",
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
  db.posts.unshift(created);
  return created;
}

export function publishPost(id: string, authorId: string): PostRecord | null {
  const db = getDb();
  const idx = db.posts.findIndex((p) => p.id === id && p.authorId === authorId);
  if (idx < 0 || !db.posts[idx]) return null;
  const target = db.posts[idx];
  const now = new Date().toISOString();
  const published: PostRecord = {
    ...target,
    status: target.moderationLocked ? "UNDER_REVIEW" : "PUBLISHED",
    slug: target.slug || toSlug(target.title, target.id),
    publishedAt: target.publishedAt ?? now,
    updatedAt: now,
  };
  db.posts[idx] = published;
  const entry = db.publishedToday.get(authorId);
  if (entry && entry.date === today()) entry.count += 1;
  else db.publishedToday.set(authorId, { date: today(), count: 1 });
  return published;
}

export function countPublishedToday(authorId: string): number {
  const entry = getDb().publishedToday.get(authorId);
  return entry && entry.date === today() ? entry.count : 0;
}

export function deletePost(id: string, authorId: string, isAdmin: boolean): boolean {
  const db = getDb();
  const idx = db.posts.findIndex(
    (p) => p.id === id && (p.authorId === authorId || isAdmin),
  );
  if (idx < 0 || !db.posts[idx]) return false;
  db.posts[idx] = { ...db.posts[idx], status: "DELETED" };
  return true;
}

export function setModerationStatus(id: string, status: PostStatus, locked: boolean): void {
  const db = getDb();
  const idx = db.posts.findIndex((p) => p.id === id);
  if (idx >= 0 && db.posts[idx]) {
    db.posts[idx] = { ...db.posts[idx], status, moderationLocked: locked };
  }
}

export function adjustCounter(
  id: string,
  field: "likeCount" | "dislikeCount" | "commentCount" | "bookmarkCount" | "viewCount",
  delta: number,
): void {
  const db = getDb();
  const idx = db.posts.findIndex((p) => p.id === id);
  if (idx >= 0 && db.posts[idx]) {
    db.posts[idx] = { ...db.posts[idx], [field]: Math.max(0, db.posts[idx][field] + delta) };
  }
}

/* --------------------------------- Interactions --------------------------------- */

export function getInteractionState(userId: string): InteractionState {
  const db = getDb();
  return {
    likedIds: Array.from(db.likes.get(userId) ?? []),
    dislikedIds: Array.from(db.dislikes.get(userId) ?? []),
    bookmarkedIds: Array.from(db.bookmarks.get(userId) ?? []),
    blockedUserIds: Array.from(db.blocks.get(userId) ?? []),
    followedUserIds: Array.from(db.follows.get(userId) ?? []),
  };
}

function notify(
  userId: string,
  type: NotificationKind,
  actor: AuthUser,
  post: PostRecord,
): void {
  if (userId === actor.id) return; // Pas de notification pour soi-même.
  getDb().notifications.unshift({
    id: newId("notif"),
    userId,
    type,
    actorUsername: actor.username,
    actorAvatarUrl: actor.avatarUrl,
    postTitle: post.title,
    postId: post.id,
    postSlug: post.slug,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function toggleLike(userId: string, postId: string): { liked: boolean } | null {
  const db = getDb();
  const post = db.posts.find((p) => p.id === postId && p.status !== "DELETED");
  if (!post) return null;
  const likes = getSet(db.likes, userId);
  const dislikes = getSet(db.dislikes, userId);
  const liked = !likes.has(postId);
  if (liked) {
    likes.add(postId);
    if (dislikes.delete(postId)) adjustCounter(postId, "dislikeCount", -1);
  } else {
    likes.delete(postId);
  }
  adjustCounter(postId, "likeCount", liked ? 1 : -1);
  if (liked) {
    const actor = findUserById(userId);
    if (actor) notify(post.authorId, "LIKE", actor, post);
  }
  return { liked };
}

export function toggleDislike(userId: string, postId: string): { disliked: boolean } | null {
  const db = getDb();
  const post = db.posts.find((p) => p.id === postId && p.status !== "DELETED");
  if (!post) return null;
  const dislikes = getSet(db.dislikes, userId);
  const likes = getSet(db.likes, userId);
  const disliked = !dislikes.has(postId);
  if (disliked) {
    dislikes.add(postId);
    if (likes.delete(postId)) adjustCounter(postId, "likeCount", -1);
  } else {
    dislikes.delete(postId);
  }
  adjustCounter(postId, "dislikeCount", disliked ? 1 : -1);
  return { disliked };
}

export function toggleBookmark(userId: string, postId: string): { bookmarked: boolean } | null {
  const db = getDb();
  const post = db.posts.find((p) => p.id === postId && p.status !== "DELETED");
  if (!post) return null;
  const set = getSet(db.bookmarks, userId);
  const bookmarked = !set.has(postId);
  if (bookmarked) set.add(postId);
  else set.delete(postId);
  adjustCounter(postId, "bookmarkCount", bookmarked ? 1 : -1);
  return { bookmarked };
}

/** Clé de déduplication des vues : hachée, jamais l'IP en clair. */
export function viewerKeyFromIp(ip: string): string {
  const configuredSalt = process.env.VIEW_HASH_SALT;
  if (process.env.NODE_ENV === "production" && (!configuredSalt || Buffer.byteLength(configuredSalt, "utf8") < 32)) {
    throw new Error("VIEW_HASH_SALT doit être configuré avec au moins 32 octets en production.");
  }
  const salt = configuredSalt ?? "qm-view-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

const VIEW_DEDUPE_MS = 90_000;

export function recordView(postId: string, viewerKey: string): boolean {
  const db = getDb();
  const post = db.posts.find((p) => p.id === postId && p.status !== "DELETED");
  if (!post) return false;
  const now = Date.now();
  const key = `${postId}:${viewerKey}`;
  const last = db.recentViews.get(key) ?? 0;
  // YouTube-like : toute visite légitime compte, même plusieurs fois par jour.
  // On déduplique uniquement dans une fenêtre de 90 s (anti-doublon refresh/navigation interne).
  if (now - last < VIEW_DEDUPE_MS) return false;
  if (db.recentViews.size > 50_000) {
    for (const [k, ts] of db.recentViews) {
      if (now - ts > 3_600_000) db.recentViews.delete(k);
    }
  }
  db.recentViews.set(key, now);
  adjustCounter(postId, "viewCount", 1);
  return true;
}

export function toggleBlockUser(blockerId: string, targetUserId: string): { blocked: boolean } {
  const set = getSet(getDb().blocks, blockerId);
  const blocked = !set.has(targetUserId);
  if (blocked) set.add(targetUserId);
  else set.delete(targetUserId);
  return { blocked };
}

export function toggleFollow(followerId: string, targetUserId: string): { following: boolean } {
  const db = getDb();
  const set = getSet(db.follows, followerId);
  const following = !set.has(targetUserId);
  if (following) set.add(targetUserId);
  else set.delete(targetUserId);
  const authorIdx = db.authors.findIndex((a) => a.userId === targetUserId);
  if (authorIdx >= 0 && db.authors[authorIdx]) {
    db.authors[authorIdx] = {
      ...db.authors[authorIdx],
      followersCount: Math.max(0, db.authors[authorIdx].followersCount + (following ? 1 : -1)),
    };
  }
  return { following };
}

/* -------------------------------- Commentaires -------------------------------- */

/** Nombre de likes d'un commentaire. */
function commentLikeCount(commentId: string): number {
  return getDb().commentLikes.get(commentId)?.size ?? 0;
}

export function toggleCommentLike(commentId: string, userId: string): { liked: boolean; likeCount: number } | null {
  const db = getDb();
  const comment = db.comments.find((c) => c.id === commentId && c.status !== "DELETED");
  if (!comment) return null;
  const set = getSet(db.commentLikes, commentId);
  const liked = !set.has(userId);
  if (liked) set.add(userId);
  else set.delete(userId);
  const likeCount = set.size;
  return { liked, likeCount };
}

export function listComments(postId: string, viewerId?: string | null): CommentItemData[] {
  const db = getDb();
  return db.comments
    .filter((c) => c.postId === postId && c.status === "VISIBLE")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => ({
      ...c,
      likeCount: commentLikeCount(c.id),
      likedByMe: viewerId ? (getDb().commentLikes.get(c.id) ?? new Set()).has(viewerId) : false,
    }));
}

export function addComment(input: {
  postId: string;
  author: AuthUser;
  parentId: string | null;
  body: string;
}): CommentItemData | null {
  const db = getDb();
  const post = db.posts.find((p) => p.id === input.postId && p.status === "PUBLISHED");
  if (!post || !post.commentsEnabled) return null;
  const created: CommentItemData = {
    id: newId("com"),
    postId: input.postId,
    authorId: input.author.id,
    authorUsername: input.author.username,
    authorAvatarUrl: input.author.avatarUrl,
    parentId: input.parentId,
    body: input.body,
    status: "VISIBLE",
    createdAt: new Date().toISOString(),
    likeCount: 0,
    likedByMe: false,
  };
  db.comments.push(created);
  adjustCounter(input.postId, "commentCount", 1);
  notify(post.authorId, "COMMENT", input.author, post);
  return created;
}

/** Masque un commentaire : auteur du commentaire, auteur du texte ou administrateur. */
export function hideComment(commentId: string, actor: AuthUser): "ok" | "not-found" | "forbidden" {
  const db = getDb();
  const idx = db.comments.findIndex((c) => c.id === commentId);
  if (idx < 0 || !db.comments[idx]) return "not-found";
  const comment = db.comments[idx];
  const post = db.posts.find((p) => p.id === comment.postId);
  const isMod = actor.role === "admin";
  const isCommentAuthor = comment.authorId === actor.id;
  const isPostAuthor = post?.authorId === actor.id;
  if (!isMod && !isCommentAuthor && !isPostAuthor) return "forbidden";
  db.comments[idx] = { ...comment, status: "HIDDEN_BY_AUTHOR" };
  adjustCounter(comment.postId, "commentCount", -1);
  return "ok";
}

/* -------------------------------- Notifications -------------------------------- */

export function listNotifications(userId: string): NotificationItem[] {
  return getDb()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100);
}

export function markNotificationsRead(userId: string, ids: string[]): number {
  const target = new Set(ids);
  let changed = 0;
  const db = getDb();
  for (let i = 0; i < db.notifications.length; i += 1) {
    const item = db.notifications[i];
    if (item && item.userId === userId && target.has(item.id) && !item.read) {
      db.notifications[i] = { ...item, read: true };
      changed += 1;
    }
  }
  return changed;
}

/* ------------------------------- Modération / audit ------------------------------- */

export function listReports(): ReportItem[] {
  return [...getDb().reports].sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
}

export function createReport(input: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  details: string;
}): ReportItem | "duplicate" {
  const db = getDb();
  const exists = db.reports.some(
    (r) => r.reporterId === input.reporterId && r.targetType === input.targetType && r.targetId === input.targetId,
  );
  if (exists) return "duplicate";
  const created: ReportItem = {
    id: newId("rep"),
    ...input,
    priority: input.reason === "DANGER" ? 2 : 0,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };
  db.reports.unshift(created);
  return created;
}

export function setReportStatus(id: string, status: "RESOLVED" | "DISMISSED"): boolean {
  const db = getDb();
  const idx = db.reports.findIndex((r) => r.id === id);
  if (idx < 0 || !db.reports[idx]) return false;
  db.reports[idx] = { ...db.reports[idx], status };
  return true;
}

export function listAudit(): AuditEntry[] {
  return [...getDb().audit].slice(0, 200);
}

export function pushAudit(
  actorUsername: string,
  action: string,
  targetLabel: string,
  reason: string,
): AuditEntry {
  const entry: AuditEntry = {
    id: newId("audit"),
    actorUsername,
    action,
    targetLabel,
    reason,
    createdAt: new Date().toISOString(),
  };
  getDb().audit.unshift(entry);
  return entry;
}

export function getSettings(): SiteSettings {
  return { ...getDb().settings };
}

export function updateSettings(next: SiteSettings): SiteSettings {
  getDb().settings = { ...next };
  return { ...getDb().settings };
}

export function adminModerate(input: {
  actorUsername: string;
  reportId: string;
  targetId: string;
  targetLabel: string;
  action: "HIDE" | "RESTORE" | "DISMISS";
  reason: string;
}): void {
  if (input.action === "HIDE") {
    setModerationStatus(input.targetId, "HIDDEN", true);
    setReportStatus(input.reportId, "RESOLVED");
  } else if (input.action === "RESTORE") {
    setModerationStatus(input.targetId, "PUBLISHED", false);
    setReportStatus(input.reportId, "RESOLVED");
  } else {
    setReportStatus(input.reportId, "DISMISSED");
  }
  pushAudit(input.actorUsername, input.action, input.targetLabel, input.reason);
}


/* ----------------------------- Compteurs dynamiques ----------------------------- */

/** Score d'engagement utilisé pour le tri "Populaires" (j'aime ×3, commentaires ×5, vues ×0.5). */
export function popularityScore(post: PostRecord): number {
  return post.likeCount * 3 + post.commentCount * 5 + Math.round(post.viewCount * 0.5);
}

/** Nombre de textes publiés d'un auteur. */
export function countPublishedPostsByAuthor(authorId: string): number {
  return getDb().posts.filter(
    (p) => p.authorId === authorId && p.status === "PUBLISHED",
  ).length;
}

/** Nombre de textes publiés d'un thème. */
export function countPublishedPostsByTheme(themeSlug: string): number {
  return getDb().posts.filter(
    (p) => p.status === "PUBLISHED" && p.themeSlugs.includes(themeSlug),
  ).length;
}

/** Nombre d'abonnés d'un auteur. */
export function countFollowers(userId: string): number {
  let total = 0;
  for (const set of getDb().follows.values()) {
    if (set.has(userId)) total += 1;
  }
  return total;
}

/** Enrichit les statistiques d'un auteur à partir du store réel. */
function withAuthorStats(a: AuthorProfile): AuthorProfile {
  return {
    ...a,
    postCount: countPublishedPostsByAuthor(a.userId),
    followersCount: countFollowers(a.userId),
  };
}

/** Enrichit les statistiques d'un thème à partir du store réel. */
function withThemeStats(t: ThemeItem): ThemeItem {
  return { ...t, postCount: countPublishedPostsByTheme(t.slug) };
}

/* ----------------------------------- Recherche ----------------------------------- */

export function search(query: string, tab: SearchTab, viewerId?: string | null): SearchResponse {
  const db = getDb();
  const feed = listFeed({ viewerId, limit: 50 });
  const items: SearchResultItem[] = [];
  if (tab === "all" || tab === "posts") {
    for (const p of feed.items) {
      if (isFuzzyMatch(`${p.title} ${p.excerpt} ${p.tagSlugs.join(" ")}`, query)) {
        items.push({ id: p.id, kind: "post", title: p.title, subtitle: `Par ${p.authorUsername} · 2 min`, href: `/mots/${p.id}`, imageUrl: p.heroImageUrl });
      }
    }
  }
  if (tab === "all" || tab === "themes") {
    for (const t of db.themes.filter((t) => t.active && isFuzzyMatch(`${t.name} ${t.tagline}`, query))) {
      items.push({ id: t.id, kind: "theme", title: `Thème : ${t.name}`, subtitle: `${formatCount(t.postCount)} publications`, href: `/themes/${t.id}` });
    }
  }
  if (tab === "all" || tab === "authors") {
    for (const a of db.authors.filter((a) => a.listedInDirectory && a.status === "ACTIVE" && isFuzzyMatch(`${a.username} ${a.bio}`, query))) {
      items.push({ id: a.userId, kind: "author", title: a.username, subtitle: `Auteur · ${formatCount(a.postCount)} publications`, href: `/auteurs/${a.userId}`, imageUrl: a.avatarUrl });
    }
  }
  if (tab === "all" || tab === "tags") {
    for (const g of db.tags.filter((g) => g.status === "APPROVED" && isFuzzyMatch(g.label, query))) {
      items.push({ id: g.slug, kind: "tag", title: `#${g.label}`, subtitle: `${formatCount(g.useCount)} textes`, href: `/tags/${g.slug}` });
    }
  }
  return { total: items.length, items };
}

export function listTags(): TagItem[] {
  return getDb().tags.filter((t) => t.status === "APPROVED");
}

export function getTagBySlug(slug: string): TagItem | null {
  const clean = normalizeSearchText(slug);
  return getDb().tags.find((t) => normalizeSearchText(t.slug) === clean) ?? null;
}

export function suggestTagsFromText(text: string): string[] {
  const norm = normalizeSearchText(text);
  const matched = getDb().tags.filter((t) => norm.includes(t.slug)).map((t) => t.label);
  const defaults = ["Amour", "Solitude", "Vie", "Espoir"];
  return Array.from(new Set([...matched, ...defaults])).slice(0, 5);
}

export function listThemes(query?: string): ThemeItem[] {
  const db = getDb();
  const clean = normalizeSearchText(query ?? "");
  const postCounts = new Map<string, number>();
  for (const post of db.posts) {
    if (post.status !== "PUBLISHED") continue;
    for (const themeSlug of post.themeSlugs) {
      postCounts.set(themeSlug, (postCounts.get(themeSlug) ?? 0) + 1);
    }
  }
  return db.themes
    .filter((theme) => theme.active)
    .filter((theme) => !clean || normalizeSearchText(theme.name).includes(clean) || normalizeSearchText(theme.tagline).includes(clean))
    .sort((a, b) => a.position - b.position)
    .map((theme) => ({ ...theme, postCount: postCounts.get(theme.slug) ?? 0 }));
}

export function getThemeById(id: string): ThemeItem | null {
  const found = getDb().themes.find((t) => t.id === id && t.active);
  return found ? withThemeStats(found) : null;
}

export function getThemeBySlug(slug: string): ThemeItem | null {
  const found = getDb().themes.find((t) => t.slug === slug && t.active);
  return found ? withThemeStats(found) : null;
}

export function listAuthors(query?: string): AuthorProfile[] {
  const db = getDb();
  const clean = normalizeSearchText(query ?? "");
  const postCounts = new Map<string, number>();
  const followerCounts = new Map<string, number>();

  for (const post of db.posts) {
    if (post.status === "PUBLISHED") {
      postCounts.set(post.authorId, (postCounts.get(post.authorId) ?? 0) + 1);
    }
  }
  for (const followedIds of db.follows.values()) {
    for (const followedId of followedIds) {
      followerCounts.set(followedId, (followerCounts.get(followedId) ?? 0) + 1);
    }
  }

  return db.authors
    .filter((author) => {
      if (!author.listedInDirectory || author.status !== "ACTIVE") return false;
      if (!clean) return true;
      return normalizeSearchText(author.username).includes(clean) || normalizeSearchText(author.bio).includes(clean);
    })
    .map((author) => ({
      ...author,
      postCount: postCounts.get(author.userId) ?? 0,
      followersCount: followerCounts.get(author.userId) ?? 0,
    }))
    .sort((a, b) => (b.followersCount + b.postCount * 2) - (a.followersCount + a.postCount * 2));
}

export function getAuthorById(id: string): AuthorProfile | null {
  const target = id;
  const found = getDb().authors.find(
    (a) => a.userId === target && a.status === "ACTIVE",
  );
  return found ? withAuthorStats(found) : null;
}

export function getAuthorByUsername(username: string): AuthorProfile | null {
  const target = normalizeSearchText(username);
  const found = getDb().authors.find(
    (a) => normalizeSearchText(a.username) === target && a.status === "ACTIVE",
  );
  return found ? withAuthorStats(found) : null;
}

/* ------------------------------- Suppression de compte ------------------------------ */

/**
 * Supprime définitivement un compte : textes et commentaires en DELETED,
 * profil auteur retiré de l'annuaire, session invalide côté serveur.
 */
export function deleteAccount(userId: string): void {
  const db = getDb();
  for (const post of db.posts) {
    if (post.authorId === userId) post.status = "DELETED";
  }
  for (const comment of db.comments) {
    if (comment.authorId === userId) comment.status = "DELETED";
  }
  db.authors = db.authors.filter((a) => a.userId !== userId);
  db.users = db.users.filter((u) => u.id !== userId);
  db.notifications = db.notifications.filter((n) => n.userId !== userId);
  db.likes.delete(userId);
  db.dislikes.delete(userId);
  db.bookmarks.delete(userId);
  db.follows.delete(userId);
  db.blocks.delete(userId);
  db.publishedToday.delete(userId);
}
