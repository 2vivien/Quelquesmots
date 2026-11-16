/**
 * Référentiels PostgreSQL (Drizzle) pour toute la logique métier de l'application.
 * Chaque fonction lit/écrit la base Neon ; aucun état n'est gardé en mémoire.
 */
import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, notInArray, or, sql } from "drizzle-orm";
import type { AuthUser } from "@/features/auth";
import type { AuditEntry, SiteSettings } from "@/features/admin/types/admin.types";
import type { AuthorProfile } from "@/features/authors/types/authors.types";
import type { CommentItemData, CommentStatus } from "@/features/comments/types/comments.types";
import type { InteractionState } from "@/features/interactions/types/interactions.types";
import type { ReportItem, ReportReason, ReportTargetType } from "@/features/moderation/types/moderation.types";
import type { NotificationKind, NotificationItem } from "@/features/notifications/types/notifications.types";
import type { FeedPage, FeedQuery, PostRecord, PostSummary } from "@/features/posts/types/posts.types";
import { canViewPost } from "@/features/posts/utils/visibility";
import type { TagItem } from "@/features/tags/types/tags.types";
import type { ThemeItem, ThemeCategory } from "@/features/themes/types/themes.types";
import { formatCount, normalizeSearchText } from "@/lib/format";
import { isFuzzyMatch } from "@/features/search/utils/fuzzy";
import type { SearchResponse, SearchResultItem, SearchTab } from "@/features/search/types/search.types";
import type { PostStatus, PublishAs, Visibility } from "@/types";
import { getDatabase } from "@/db";
import { withCatalogCache, invalidateCatalog } from "@/lib/server/catalog-cache";
import { unstable_cache } from "next/cache";
import { revalidatePublicCache } from "@/lib/server/data-cache";
import {
  adminAudit,
  authorProfiles,
  comments,
  commentLikes,
  notifications,
  oauthAccounts,
  postBookmarks,
  postReactions,
  postThemes,
  postTags,
  postViewDedupe,
  reports,
  sessions,
  siteSettings,
  tags,
  themes,
  users,
  userBlocks,
  userFollows,
  posts,
} from "@/db/schema";


/** Handle de transaction Drizzle (équivalent typé de db pour les helpers internes). */
type DbTx = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];

const authColumns = {
  id: users.id,
  username: authorProfiles.username,
  firstName: authorProfiles.firstName,
  lastName: authorProfiles.lastName,
  bio: authorProfiles.bio,
  avatarUrl: authorProfiles.avatarUrl,
  defaultPublishAs: authorProfiles.defaultPublishAs,
  listedInDirectory: authorProfiles.listedInDirectory,
  showJoinDate: authorProfiles.showJoinDate,
  role: users.role,
  onboarded: users.onboarded,
};

async function selectAuthUserById(id: string): Promise<AuthUser | null> {
  const db = getDatabase();
  const rows = await db
    .select(authColumns)
    .from(users)
    .innerJoin(authorProfiles, eq(authorProfiles.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

const postColumns = {
  id: posts.id,
  title: posts.title,
  excerpt: posts.excerpt,
  contentJson: posts.contentJson,
  contentText: posts.contentText,
  authorId: posts.authorId,
  authorUsername: posts.authorUsername,
  authorFirstName: posts.authorFirstName,
  authorLastName: posts.authorLastName,
  authorAvatarUrl: posts.authorAvatarUrl,
  publishAs: posts.publishAs,
  visibility: posts.visibility,
  status: posts.status,
  heroImageUrl: posts.heroImageUrl,
  commentsEnabled: posts.commentsEnabled,
  moderationLocked: posts.moderationLocked,
  viewCount: posts.viewCount,
  likeCount: posts.likeCount,
  dislikeCount: posts.dislikeCount,
  commentCount: posts.commentCount,
  bookmarkCount: posts.bookmarkCount,
  publishedAt: posts.publishedAt,
  createdAt: posts.createdAt,
  updatedAt: posts.updatedAt,
};

type PostRow = typeof posts.$inferSelect;

function mapPostRow(row: PostRow & { themeIds?: string[]; tagIds?: string[]; tagLabels?: string[] }): PostRecord {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    contentJson: row.contentJson as PostRecord["contentJson"],
    contentText: row.contentText,
    authorId: row.authorId ?? "",
    authorUsername: row.authorUsername,
    authorFirstName: row.authorFirstName ?? undefined,
    authorLastName: row.authorLastName ?? undefined,
    authorAvatarUrl: row.authorAvatarUrl,
    publishAs: row.publishAs as PublishAs,
    visibility: row.visibility as Visibility,
    status: row.status as PostStatus,
    themeIds: row.themeIds ?? [],
    tagIds: row.tagIds ?? [],
    tagLabels: row.tagLabels ?? [],
    heroImageUrl: row.heroImageUrl,
    commentsEnabled: row.commentsEnabled,
    moderationLocked: row.moderationLocked,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    dislikeCount: row.dislikeCount,
    commentCount: row.commentCount,
    bookmarkCount: row.bookmarkCount,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function stripPostContent(post: PostRecord): PostSummary {
  const summary = { ...post } as Record<string, unknown>;
  delete summary.contentJson;
  delete summary.contentText;
  return summary as unknown as PostSummary;
}

async function loadPostThemesTags(postId: string): Promise<{ themeIds: string[]; tagIds: string[]; tagLabels: string[] }> {
  const db = getDatabase();
  const [themesRows, tagsRows] = await Promise.all([
    db.select({ themeId: postThemes.themeId }).from(postThemes).where(eq(postThemes.postId, postId)),
    db.select({ tagId: tags.id, label: tags.label }).from(postTags).innerJoin(tags, eq(tags.id, postTags.tagId)).where(eq(postTags.postId, postId)),
  ]);
  return {
    themeIds: themesRows.map((r) => r.themeId),
    tagIds: tagsRows.map((r) => r.tagId),
    tagLabels: tagsRows.map((r) => r.label),
  };
}

async function loadPostsThemesTags(postIds: string[]): Promise<Map<string, { themeIds: string[]; tagIds: string[]; tagLabels: string[] }>> {
  if (postIds.length === 0) return new Map();
  const db = getDatabase();
  const [themeRows, tagRows] = await Promise.all([
    db.select({ postId: postThemes.postId, themeId: postThemes.themeId }).from(postThemes).where(inArray(postThemes.postId, postIds)),
    db.select({ postId: postTags.postId, tagId: tags.id, label: tags.label }).from(postTags).innerJoin(tags, eq(tags.id, postTags.tagId)).where(inArray(postTags.postId, postIds)),
  ]);
  const map = new Map<string, { themeIds: string[]; tagIds: string[]; tagLabels: string[] }>();
  for (const id of postIds) map.set(id, { themeIds: [], tagIds: [], tagLabels: [] });
  for (const row of themeRows) map.get(row.postId)?.themeIds.push(row.themeId);
  for (const row of tagRows) {
    const entry = map.get(row.postId);
    entry?.tagIds.push(row.tagId);
    entry?.tagLabels.push(row.label);
  }
  return map;
}

async function mapPostRowIds(rows: PostRow[]): Promise<PostRecord[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const linked = await loadPostsThemesTags(ids);
  return rows.map((row) => mapPostRow({ ...row, ...linked.get(row.id) }));
}

async function mapSummaries(rows: PostRow[]): Promise<PostSummary[]> {
  const full = await mapPostRowIds(rows);
  return full.map(stripPostContent);
}

/* ---------------------------------- Utilisateurs ---------------------------------- */

export async function findUserById(id: string): Promise<AuthUser | null> {
  return selectAuthUserById(id);
}

export async function findUserByUsername(username: string): Promise<AuthUser | null> {
  const target = normalizeSearchText(username);
  const db = getDatabase();
  const rows = await db
    .select(authColumns)
    .from(users)
    .innerJoin(authorProfiles, eq(authorProfiles.userId, users.id))
    .where(sql`lower(${authorProfiles.usernameNormalized}) = ${target}`)
    .limit(1);
  return rows[0] ?? null;
}

export async function isUsernameAvailable(username: string, exceptUserId?: string): Promise<boolean> {
  const target = normalizeSearchText(username.trim());
  if (!target) return false;
  const db = getDatabase();
  const rows = exceptUserId
    ? await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(authorProfiles, eq(authorProfiles.userId, users.id))
        .where(sql`lower(${authorProfiles.usernameNormalized}) = ${target} AND ${users.id} <> ${exceptUserId}`)
        .limit(1)
    : await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(authorProfiles, eq(authorProfiles.userId, users.id))
        .where(sql`lower(${authorProfiles.usernameNormalized}) = ${target}`)
        .limit(1);
  return rows.length === 0;
}

export async function getOAuthUserByProvider(provider: string, providerAccountId: string): Promise<string | null> {
  const db = getDatabase();
  const rows = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerAccountId, providerAccountId)))
    .limit(1);
  return rows[0]?.userId ?? null;
}

export async function linkOauthAccount(input: {
  provider: string;
  providerAccountId: string;
  providerEmail: string | null;
  userId: string;
}): Promise<void> {
  const db = getDatabase();
  await db
    .insert(oauthAccounts)
    .values({ id: randomUUID(), userId: input.userId, provider: input.provider, providerAccountId: input.providerAccountId, providerEmail: input.providerEmail })
    .onConflictDoNothing({ target: [oauthAccounts.provider, oauthAccounts.providerAccountId] });
}

export async function findOrCreateGoogleUser(input: {
  googleSub: string;
  email: string | null;
  givenName: string | null;
  familyName: string | null;
  avatarUrl: string | null;
}): Promise<{ user: AuthUser; createdNew: boolean }> {
  const db = getDatabase();
  const existing = await getOAuthUserByProvider("google", input.googleSub);
  if (existing) {
    const row = await selectAuthUserById(existing);
    if (row) return { user: row, createdNew: false };
  }
  const id = randomUUID();
  const username = `plume-${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id, email: input.email, role: "user", status: "ACTIVE", onboarded: false });
    await tx.insert(authorProfiles).values({
      userId: id,
      username,
      usernameNormalized: normalizeSearchText(username),
      firstName: input.givenName ?? "",
      lastName: input.familyName ?? "",
      bio: "",
      avatarUrl: input.avatarUrl ?? "/images/editorial/avatar-emma.jpg",
      defaultPublishAs: "USERNAME",
      listedInDirectory: true,
      showJoinDate: true,
      status: "ACTIVE",
    });
    await tx.insert(oauthAccounts).values({ id: randomUUID(), userId: id, provider: "google", providerAccountId: input.googleSub, providerEmail: input.email });
  });
  const row = await selectAuthUserById(id);
  if (!row) throw new Error("Création utilisateur Google impossible");
  return { user: row, createdNew: true };
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<AuthUser, "firstName" | "lastName" | "username" | "bio" | "defaultPublishAs" | "listedInDirectory" | "showJoinDate" | "onboarded" | "avatarUrl">>,
): Promise<AuthUser | null> {
  const db = getDatabase();
  const id = userId;
  const currentRows = await db
    .select({ userId: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (currentRows.length === 0) return null;

  const patchUser: Partial<typeof users.$inferInsert> = {};
  const patchProfile: Partial<typeof authorProfiles.$inferInsert> = {};
  if (patch.firstName !== undefined) patchProfile.firstName = patch.firstName;
  if (patch.lastName !== undefined) patchProfile.lastName = patch.lastName;
  if (patch.bio !== undefined) patchProfile.bio = patch.bio;
  if (patch.username !== undefined) {
    patchProfile.username = patch.username;
    patchProfile.usernameNormalized = normalizeSearchText(patch.username);
  }
  if (patch.defaultPublishAs !== undefined) patchProfile.defaultPublishAs = patch.defaultPublishAs;
  if (patch.listedInDirectory !== undefined) patchProfile.listedInDirectory = patch.listedInDirectory;
  if (patch.showJoinDate !== undefined) patchProfile.showJoinDate = patch.showJoinDate;
  if (patch.avatarUrl !== undefined) patchProfile.avatarUrl = patch.avatarUrl;
  if (patch.onboarded !== undefined) patchUser.onboarded = patch.onboarded;

  await db.transaction(async (tx) => {
    if (Object.keys(patchUser).length > 0) {
      await tx.update(users).set(patchUser).where(eq(users.id, id));
    }
    if (Object.keys(patchProfile).length > 0) {
      await tx.update(authorProfiles).set(patchProfile).where(eq(authorProfiles.userId, id));
    }
  });
  // Le profil est public : on invalide Upstash + Data Cache Next.
  await invalidateCatalog();
  return selectAuthUserById(userId);
}

/* ----------------------------------- Textes ----------------------------------- */

/** Curseur keyset opaque pour la pagination du flux : `base64url({ pa: published_at, id })`. */
function encodeFeedCursor(publishedAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ pa: publishedAt.toISOString(), id })).toString("base64url");
}

function decodeFeedCursor(raw: string): { pa: Date; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { pa?: unknown; id?: unknown };
    if (typeof parsed.pa !== "string" || typeof parsed.id !== "string") return null;
    const pa = new Date(parsed.pa);
    if (Number.isNaN(pa.getTime()) || parsed.id.length === 0) return null;
    return { pa, id: parsed.id };
  } catch {
    return null;
  }
}

/** Erreur de curseur (le client echobe un curseur non produit par le serveur). */
export class InvalidFeedCursorError extends Error {}

async function listFeedUncached(query: FeedQuery): Promise<FeedPage> {
  const db = getDatabase();
  const blockedIds = query.blockedAuthorIds ?? [];
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const conditions = [eq(posts.status, "PUBLISHED")];
  const viewerId = query.viewerId ?? null;
  // Visibilité appliquée en SQL : public pour tous, privé uniquement pour le propriétaire.
  if (viewerId) {
    conditions.push(or(eq(posts.visibility, "PUBLIC"), eq(posts.authorId, viewerId))!);
  } else {
    conditions.push(eq(posts.visibility, "PUBLIC"));
  }
  if (query.themeId) {
    // Sous-requête directe sur post_themes (id de thème).
    const sub = db
      .select({ postId: postThemes.postId })
      .from(postThemes)
      .where(eq(postThemes.themeId, query.themeId));
    conditions.push(inArray(posts.id, sub as unknown as string[]));
  }
  if (query.tagId) {
    const sub = db.select({ postId: postTags.postId }).from(postTags).where(eq(postTags.tagId, query.tagId));
    conditions.push(inArray(posts.id, sub as unknown as string[]));
  }
  if (query.authorId) {
    conditions.push(eq(posts.authorId, query.authorId));
  }
  if (blockedIds.length > 0) {
    conditions.push(notInArray(posts.authorId, blockedIds));
  }

  if (query.sort === "top") {
    // Tri populaire : fenêtre bornée (le score évolue, pas de keyset stable). nextCursor = null.
    const where = conditions.length === 1 ? conditions[0] : and(...conditions);
    const rows = await db
      .select(postColumns)
      .from(posts)
      .where(where)
      .orderBy(desc(sql`${posts.likeCount} * 3 + ${posts.commentCount} * 5 + ${posts.viewCount} * 0.5`), desc(posts.id))
      .limit(limit);
    const items = (await mapSummaries(rows));
    return { items, nextCursor: null };
  }

  // Pagination keyset (published_at, id) : stable même si des textes sont publiés entre deux pages.
  const cursor = query.cursor ? decodeFeedCursor(query.cursor) : null;
  if (query.cursor && !cursor) throw new InvalidFeedCursorError("invalid-feed-cursor");
  if (cursor) {
    conditions.push(sql`(${posts.publishedAt}, ${posts.id}) < (${cursor.pa}, ${cursor.id})`);
  }
  const where = conditions.length === 1 ? conditions[0] : and(...conditions);
  const rows = await db
    .select(postColumns)
    .from(posts)
    .where(where)
    .orderBy(sql`${posts.publishedAt} desc nulls last`, desc(posts.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const items = await mapSummaries(page);
  const last = page.at(-1);
  const nextCursor = hasMore && last?.publishedAt ? encodeFeedCursor(last.publishedAt, last.id) : null;
  return { items, nextCursor };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Un identifiant invalide est traité comme une ressource absente (404), pas comme une erreur SQL. */
const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

async function getPostByIdUncached(id: string): Promise<PostRecord | null> {
  if (!isUuid(id)) return null;
  const db = getDatabase();
  const rows = await db.select(postColumns).from(posts).where(eq(posts.id, id)).limit(1);
  if (rows.length === 0) return null;
  const [mapped] = await mapPostRowIds(rows);
  return mapped ?? null;
}

async function getPostsByIdsUncached(ids: string[], viewerId?: string | null): Promise<PostSummary[]> {
  const validIds = ids.filter(isUuid);
  if (validIds.length === 0) return [];
  const db = getDatabase();
  const rows = await db.select(postColumns).from(posts).where(inArray(posts.id, validIds));
  const mapped = await mapPostRowIds(rows);
  const byId = new Map(mapped.map((p) => [p.id, p]));
  return validIds.flatMap((id) => {
    const post = byId.get(id);
    return post && canViewPost(post, viewerId) ? [stripPostContent(post)] : [];
  });
}

async function listRelatedUncached(post: PostRecord, viewerId?: string | null): Promise<PostSummary[]> {
  if (post.themeIds.length === 0) return [];
  const db = getDatabase();
  const rows = await db
    .selectDistinctOn([posts.id], postColumns)
    .from(posts)
    .innerJoin(postThemes, eq(postThemes.postId, posts.id))
    .where(and(
      eq(posts.status, "PUBLISHED"),
      sql`${posts.id} <> ${post.id}`,
      inArray(postThemes.themeId, post.themeIds),
    ))
    .limit(6);
  const mapped = await mapPostRowIds(rows);
  return mapped.filter((p) => canViewPost(p, viewerId)).slice(0, 3).map(stripPostContent);
}

export async function listDrafts(authorId: string): Promise<PostSummary[]> {
  const db = getDatabase();
  const rows = await db
    .select(postColumns)
    .from(posts)
    .where(and(eq(posts.status, "DRAFT"), eq(posts.authorId, authorId)))
    .orderBy(desc(posts.updatedAt));
  return mapSummaries(rows);
}

const DEFAULT_EMPTY_CONTENT = { type: "doc", content: [{ type: "paragraph" }] } as const;

export async function upsertDraft(draft: Partial<PostRecord> & { authorId: string }): Promise<PostRecord> {
  const db = getDatabase();
  const author = await findUserById(draft.authorId);
  if (!author) throw new Error("Auteur introuvable.");
  const now = new Date();

  // Édition d'un brouillon existant
  if (draft.id) {
    const existingRows = await db.select(postColumns).from(posts).where(and(eq(posts.id, draft.id), eq(posts.authorId, draft.authorId), eq(posts.status, "DRAFT"))).limit(1);
    if (existingRows.length === 0) throw new Error("Brouillon introuvable.");
    const existing = existingRows[0]!;
    await db.transaction(async (tx) => {
      await tx.update(posts).set({
        title: draft.title ?? existing.title,
        excerpt: draft.excerpt ?? existing.excerpt,
        contentJson: (draft.contentJson as typeof existing.contentJson) ?? existing.contentJson,
        contentText: draft.contentText ?? existing.contentText,
        authorUsername: draft.authorUsername ?? existing.authorUsername,
        authorFirstName: draft.authorFirstName ?? existing.authorFirstName,
        authorLastName: draft.authorLastName ?? existing.authorLastName,
        authorAvatarUrl: draft.authorAvatarUrl ?? existing.authorAvatarUrl,
        publishAs: draft.publishAs ?? existing.publishAs,
        visibility: draft.visibility ?? existing.visibility,
        heroImageUrl: draft.heroImageUrl ?? existing.heroImageUrl,
        commentsEnabled: draft.commentsEnabled ?? existing.commentsEnabled,
        updatedAt: now,
      }).where(eq(posts.id, existing.id));
      if (draft.themeIds !== undefined) {
        await tx.delete(postThemes).where(eq(postThemes.postId, existing.id));
        await replacePostThemes(tx, existing.id, draft.themeIds);
      }
      if (draft.tagIds !== undefined) {
        await tx.delete(postTags).where(eq(postTags.postId, existing.id));
        await replacePostTags(tx, existing.id, draft.tagIds);
      }
    });
    const updated = await getPostById(existing.id);
    if (!updated) throw new Error("Brouillon devenu indisponible.");
    return updated;
  }

  // Création
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(posts).values({
      id,
      title: draft.title?.trim() || "Sans titre",
      excerpt: draft.excerpt ?? "",
      contentJson: (draft.contentJson ?? DEFAULT_EMPTY_CONTENT) as typeof posts.$inferSelect.contentJson,
      contentText: draft.contentText ?? "",
      authorId: draft.authorId,
      authorUsername: draft.authorUsername ?? author.username,
      authorFirstName: draft.authorFirstName ?? author.firstName,
      authorLastName: draft.authorLastName ?? author.lastName,
      authorAvatarUrl: draft.authorAvatarUrl ?? author.avatarUrl,
      publishAs: draft.publishAs ?? "USERNAME",
      visibility: draft.visibility ?? "PUBLIC",
      status: "DRAFT",
      heroImageUrl: draft.heroImageUrl ?? "/images/editorial/hero-lecture.jpg",
      commentsEnabled: draft.commentsEnabled ?? true,
      moderationLocked: false,
      updatedAt: now,
    });
    if (draft.themeIds) await replacePostThemes(tx, id, draft.themeIds);
    if (draft.tagIds) await replacePostTags(tx, id, draft.tagIds);
  });
  const created = await getPostById(id);
  if (!created) throw new Error("Création du brouillon impossible.");
  return created;
}

async function replacePostThemes(tx: unknown, postId: string, themeIds: string[]): Promise<void> {
  const typedTx = tx as ReturnType<typeof getDatabase>;
  await typedTx.delete(postThemes).where(eq(postThemes.postId, postId));
  if (themeIds.length === 0) return;
  const themeRows = await typedTx
    .select({ id: themes.id })
    .from(themes)
    .where(inArray(themes.id, themeIds));
  const valid = new Set(themeRows.map((r) => r.id));
  const values = themeIds.filter((id) => valid.has(id)).map((themeId) => ({ postId, themeId }));
  if (values.length === 0) return;
  await typedTx.insert(postThemes).values(values).onConflictDoNothing({ target: [postThemes.postId, postThemes.themeId] });
}

async function replacePostTags(tx: unknown, postId: string, tagIds: string[]): Promise<void> {
  const typedTx = tx as ReturnType<typeof getDatabase>;
  await typedTx.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length === 0) return;
  // Seuls des tags APPROVED existants peuvent être liés (les ids sont fournis par le client).
  const existing = await typedTx
    .select({ id: tags.id })
    .from(tags)
    .where(and(inArray(tags.id, tagIds), eq(tags.status, "APPROVED")));
  const existingSet = new Set(existing.map((r) => r.id));
  const valid = tagIds.filter((id) => existingSet.has(id));
  if (valid.length === 0) return;
  await typedTx
    .insert(postTags)
    .values(valid.map((tagId) => ({ postId, tagId })))
    .onConflictDoNothing({ target: [postTags.postId, postTags.tagId] });
}

export type PublishPostResult = "not-found" | "limit" | PostRecord;

export async function publishPost(id: string, authorId: string, dailyLimit: number): Promise<PublishPostResult> {
  const db = getDatabase();
  const result = await db.transaction(async (tx) => {
    // Verrouille la ligne utilisateur : deux publications concurrentes ne dépassent pas la limite.
    const lockedUser = await tx.select({ id: users.id }).from(users).where(eq(users.id, authorId)).for("update").limit(1);
    if (lockedUser.length === 0) return "not-found";

    const rows = await tx.select(postColumns).from(posts).where(and(eq(posts.id, id), eq(posts.authorId, authorId))).limit(1);
    const target = rows[0];
    if (!target) return "not-found";
    if (target.status !== "DRAFT" && target.status !== "UNDER_REVIEW") return "not-found";

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const publishedToday = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.authorId, authorId), eq(posts.status, "PUBLISHED"), sql`${posts.publishedAt} >= ${start}`));
    if ((publishedToday[0]?.count ?? 0) >= dailyLimit) return "limit";

    const now = new Date();
    const nextStatus = target.moderationLocked ? "UNDER_REVIEW" : "PUBLISHED";
    await tx.update(posts).set({
      status: nextStatus,
      publishedAt: target.publishedAt ?? now,
      updatedAt: now,
    }).where(eq(posts.id, id));
    const updatedRows = await tx.select(postColumns).from(posts).where(eq(posts.id, id)).limit(1);
    const [mapped] = await mapPostRowIds(updatedRows);
    return mapped ?? "not-found";
  });
  // Invalidation catalogue (rendu ISR/HTTP edge + Data Cache Next dépendent du catalogue) uniquement sur succès.
  if (result && typeof result === "object") {
    await invalidateCatalog();
  }
  return result;
}

export async function deletePost(id: string, authorId: string, isAdmin: boolean): Promise<boolean> {
  const db = getDatabase();
  const where = isAdmin
    ? eq(posts.id, id)
    : and(eq(posts.id, id), eq(posts.authorId, authorId));
  const rows = await db.update(posts).set({ status: "DELETED" as const, updatedAt: new Date() }).where(where).returning({ id: posts.id });
  if (rows.length > 0) {
    await invalidateCatalog();
  }
  return rows.length > 0;
}

export async function setModerationStatus(id: string, status: PostStatus, locked: boolean): Promise<void> {
  const db = getDatabase();
  await db.update(posts).set({ status, moderationLocked: locked, updatedAt: new Date() }).where(eq(posts.id, id));
  await invalidateCatalog();
}

/* --------------------------------- Interactions --------------------------------- */

/** Lecteur connecté : ids bloqués uniquement (feed) — évite les 5 requêtes de getInteractionState. */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const db = getDatabase();
  const rows = await db.select({ blockedId: userBlocks.blockedId }).from(userBlocks).where(eq(userBlocks.blockerId, userId));
  return rows.map((r) => r.blockedId);
}

export async function getInteractionState(userId: string): Promise<InteractionState> {
  const db = getDatabase();
  const [likesRows, dislikesRows, bookmarksRows, followRows, blockRows] = await Promise.all([
    db.select({ postId: postReactions.postId }).from(postReactions).where(and(eq(postReactions.userId, userId), eq(postReactions.reaction, "LIKE"))),
    db.select({ postId: postReactions.postId }).from(postReactions).where(and(eq(postReactions.userId, userId), eq(postReactions.reaction, "DISLIKE"))),
    db.select({ postId: postBookmarks.postId }).from(postBookmarks).where(eq(postBookmarks.userId, userId)),
    db.select({ followedId: userFollows.followedId }).from(userFollows).where(eq(userFollows.followerId, userId)),
    db.select({ blockedId: userBlocks.blockedId }).from(userBlocks).where(eq(userBlocks.blockerId, userId)),
  ]);
  return {
    likedIds: likesRows.map((r) => r.postId),
    dislikedIds: dislikesRows.map((r) => r.postId),
    bookmarkedIds: bookmarksRows.map((r) => r.postId),
    followedUserIds: followRows.map((r) => r.followedId),
    blockedUserIds: blockRows.map((r) => r.blockedId),
  };
}

async function insertReactionAndAdjustCounter(
  tx: DbTx,
  userId: string,
  postId: string,
  reaction: "LIKE" | "DISLIKE",
): Promise<boolean> {
  const inserted = await tx
    .insert(postReactions)
    .values({ userId, postId, reaction })
    .onConflictDoNothing({ target: [postReactions.userId, postReactions.postId] })
    .returning({ postId: postReactions.postId });
  if (inserted.length === 0) return false;
  const column = reaction === "LIKE" ? posts.likeCount : posts.dislikeCount;
  const field = reaction === "LIKE" ? "likeCount" : "dislikeCount";
  await tx.update(posts).set({ [field]: sql`${column} + 1` }).where(eq(posts.id, postId));
  return true;
}

async function deleteReactionAndAdjustCounter(
  tx: DbTx,
  userId: string,
  postId: string,
  reaction: "LIKE" | "DISLIKE",
): Promise<void> {
  const deleted = await tx
    .delete(postReactions)
    .where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId), eq(postReactions.reaction, reaction)))
    .returning({ postId: postReactions.postId });
  if (deleted.length === 0) return;
  const column = reaction === "LIKE" ? posts.likeCount : posts.dislikeCount;
  const field = reaction === "LIKE" ? "likeCount" : "dislikeCount";
  await tx.update(posts).set({ [field]: sql`greatest(${column} - 1, 0)` }).where(eq(posts.id, postId));
}

/** Verrouille un texte (SELECT … FOR UPDATE) pour sérialiser les opérations concurrentes. */
async function lockPostById(tx: DbTx, postId: string): Promise<{ id: string; authorId: string | null; title: string } | null> {
  const rows = await tx
    .select({ id: posts.id, authorId: posts.authorId, title: posts.title })
    .from(posts)
    .where(and(eq(posts.id, postId), sql`${posts.status} <> 'DELETED'`))
    .for("update")
    .limit(1);
  return rows[0] ?? null;
}

export async function toggleLike(userId: string, postId: string): Promise<{ liked: boolean }> {
  const db = getDatabase();
  const actor = await findUserById(userId);
  const result = await db.transaction(async (tx) => {
    // Le verrou FOR UPDATE sérialise les réactions concurrentes sur ce texte.
    const post = await lockPostById(tx, postId);
    if (!post) return { liked: false };

    const existingRows = await tx
      .select({ reaction: postReactions.reaction })
      .from(postReactions)
      .where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId)))
      .limit(1);
    const existing = existingRows[0]?.reaction;
    const liked = existing !== "LIKE";

    if (liked && existing === "DISLIKE") {
      await deleteReactionAndAdjustCounter(tx, userId, postId, "DISLIKE");
    }
    if (liked) {
      const inserted = await insertReactionAndAdjustCounter(tx, userId, postId, "LIKE");
      if (inserted && post.authorId && actor && actor.id !== post.authorId) {
        await notify(post.authorId, "LIKE", { id: actor.id, username: actor.username, avatarUrl: actor.avatarUrl }, { id: post.id, title: post.title }, tx);
      }
    } else {
      await deleteReactionAndAdjustCounter(tx, userId, postId, "LIKE");
    }
    return { liked };
  });
  await invalidateCatalog();
  return result;
}

export async function toggleDislike(userId: string, postId: string): Promise<{ disliked: boolean }> {
  const db = getDatabase();
  const result = await db.transaction(async (tx) => {
    const post = await lockPostById(tx, postId);
    if (!post) return { disliked: false };

    const existingRows = await tx
      .select({ reaction: postReactions.reaction })
      .from(postReactions)
      .where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId)))
      .limit(1);
    const existing = existingRows[0]?.reaction;
    const disliked = existing !== "DISLIKE";

    if (disliked && existing === "LIKE") {
      await deleteReactionAndAdjustCounter(tx, userId, postId, "LIKE");
    }
    if (disliked) {
      await insertReactionAndAdjustCounter(tx, userId, postId, "DISLIKE");
    } else {
      await deleteReactionAndAdjustCounter(tx, userId, postId, "DISLIKE");
    }
    return { disliked };
  });
  await invalidateCatalog();
  return result;
}

export async function toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
  const db = getDatabase();
  const result = await db.transaction(async (tx) => {
    const post = await lockPostById(tx, postId);
    if (!post) return { bookmarked: false };

    const existing = await tx
      .select({ userId: postBookmarks.userId })
      .from(postBookmarks)
      .where(and(eq(postBookmarks.userId, userId), eq(postBookmarks.postId, postId)))
      .limit(1);
    const bookmarked = existing.length === 0;
    if (bookmarked) {
      const inserted = await tx
        .insert(postBookmarks)
        .values({ userId, postId })
        .onConflictDoNothing({ target: [postBookmarks.userId, postBookmarks.postId] })
        .returning({ postId: postBookmarks.postId });
      if (inserted.length > 0) {
        await tx.update(posts).set({ bookmarkCount: sql`${posts.bookmarkCount} + 1` }).where(eq(posts.id, postId));
      }
    } else {
      const deleted = await tx
        .delete(postBookmarks)
        .where(and(eq(postBookmarks.userId, userId), eq(postBookmarks.postId, postId)))
        .returning({ postId: postBookmarks.postId });
      if (deleted.length > 0) {
        await tx.update(posts).set({ bookmarkCount: sql`greatest(${posts.bookmarkCount} - 1, 0)` }).where(eq(posts.id, postId));
      }
    }
    return { bookmarked };
  });
  await invalidateCatalog();
  return result;
}

/** Hash de l'IP (ou du pseudonyme) pour la déduplication des vues. */
export function viewerKeyFromIp(ip: string): string {
  const configuredSalt = process.env.VIEW_HASH_SALT;
  if (process.env.NODE_ENV === "production" && (!configuredSalt || Buffer.byteLength(configuredSalt, "utf8") < 32)) {
    throw new Error("VIEW_HASH_SALT doit être configuré avec au moins 32 octets en production.");
  }
  const salt = configuredSalt ?? "qm-view-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

export async function recordView(postId: string, viewerKey: string): Promise<boolean> {
  const db = getDatabase();
  return db.transaction(async (tx) => {
    const post = await tx
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, postId), sql`${posts.status} <> 'DELETED'`))
      .limit(1);
    if (post.length === 0) return false;

    const now = new Date();
    const threshold = new Date(now.getTime() - 90_000);
    // Insertion protégée par la clé primaire : gagne si la vue n'existait pas ;
    // sinon mise à jour conditionnelle sur la fenêtre de 90 secondes.
    const inserted = await tx
      .insert(postViewDedupe)
      .values({ postId, viewerHash: viewerKey, lastViewedAt: now })
      .onConflictDoNothing({ target: [postViewDedupe.postId, postViewDedupe.viewerHash] })
      .returning({ postId: postViewDedupe.postId });
    let counted = inserted.length > 0;
    if (!counted) {
      const updated = await tx
        .update(postViewDedupe)
        .set({ lastViewedAt: now })
        .where(and(eq(postViewDedupe.postId, postId), eq(postViewDedupe.viewerHash, viewerKey), sql`${postViewDedupe.lastViewedAt} < ${threshold}`))
        .returning({ postId: postViewDedupe.postId });
      counted = updated.length > 0;
    }
    if (!counted) return false;

    await tx.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, postId));
    return true;
  });
}

export async function toggleBlockUser(blockerId: string, targetUserId: string): Promise<{ blocked: boolean }> {
  const db = getDatabase();
  const existing = await db.select({ blockerId: userBlocks.blockerId }).from(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, targetUserId))).limit(1);
  const blocked = existing.length === 0;
  if (blocked) {
    await db.insert(userBlocks).values({ blockerId, blockedId: targetUserId }).onConflictDoNothing({ target: [userBlocks.blockerId, userBlocks.blockedId] });
  } else {
    await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, targetUserId)));
  }
  await invalidateCatalog();
  return { blocked };
}

export async function toggleFollow(followerId: string, targetUserId: string): Promise<{ following: boolean }> {
  const db = getDatabase();
  const existing = await db.select({ followerId: userFollows.followerId }).from(userFollows).where(and(eq(userFollows.followerId, followerId), eq(userFollows.followedId, targetUserId))).limit(1);
  const following = existing.length === 0;
  if (following) {
    await db.insert(userFollows).values({ followerId, followedId: targetUserId }).onConflictDoNothing({ target: [userFollows.followerId, userFollows.followedId] });
  } else {
    await db.delete(userFollows).where(and(eq(userFollows.followerId, followerId), eq(userFollows.followedId, targetUserId)));
  }
  await invalidateCatalog();
  return { following };
}

/* -------------------------------- Commentaires -------------------------------- */

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number } | null> {
  const db = getDatabase();
  const result = await db.transaction(async (tx) => {
    const comment = await tx
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.id, commentId))
      .for("update")
      .limit(1);
    if (!comment[0]) return null;

    const existing = await tx
      .select({ userId: commentLikes.userId })
      .from(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)))
      .limit(1);
    const liked = existing.length === 0;
    if (liked) {
      await tx.insert(commentLikes).values({ userId, commentId }).onConflictDoNothing({ target: [commentLikes.userId, commentLikes.commentId] });
    } else {
      await tx.delete(commentLikes).where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
    }
    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(commentLikes)
      .where(eq(commentLikes.commentId, commentId));
    return { liked, likeCount: countRows[0]?.count ?? 0 };
  });
  await invalidateCatalog();
  return result;
}

export async function listComments(postId: string, viewerId?: string | null): Promise<CommentItemData[]> {
  const db = getDatabase();
  const rows = await db.select().from(comments).where(and(eq(comments.postId, postId), eq(comments.status, "VISIBLE"))).orderBy(asc(comments.createdAt));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [likeRows, likedRows] = await Promise.all([
    db.select({ commentId: commentLikes.commentId, count: sql<number>`count(*)::int` }).from(commentLikes).where(inArray(commentLikes.commentId, ids)).groupBy(commentLikes.commentId),
    viewerId
      ? db.select({ commentId: commentLikes.commentId }).from(commentLikes).where(and(inArray(commentLikes.commentId, ids), eq(commentLikes.userId, viewerId)))
      : Promise.resolve([] as Array<{ commentId: string }>),
  ]);
  const likeCounts = new Map(likeRows.map((r) => [r.commentId, r.count]));
  const likedSet = new Set(likedRows.map((r) => r.commentId));
  return rows.map((c) => ({
    id: c.id,
    postId: c.postId,
    authorId: c.authorId ?? "",
    authorUsername: c.authorUsername,
    authorAvatarUrl: c.authorAvatarUrl,
    parentId: c.parentId ?? null,
    body: c.body,
    status: c.status as CommentStatus,
    createdAt: c.createdAt.toISOString(),
    likeCount: likeCounts.get(c.id) ?? 0,
    likedByMe: likedSet.has(c.id),
  }));
}

export type AddCommentResult =
  | { kind: "created"; comment: CommentItemData }
  | { kind: "disabled" }
  | { kind: "invalid-parent" };

export async function addComment(input: {
  postId: string;
  author: AuthUser;
  parentId: string | null;
  body: string;
}): Promise<AddCommentResult> {
  const db = getDatabase();
  const result: AddCommentResult = await db.transaction(async (tx) => {
    const locked = await tx
      .select({ id: posts.id, authorId: posts.authorId, title: posts.title, commentsEnabled: posts.commentsEnabled })
      .from(posts)
      .where(and(eq(posts.id, input.postId), eq(posts.status, "PUBLISHED")))
      .for("update")
      .limit(1);
    const target = locked[0];
    if (!target) return { kind: "disabled" };
    if (!target.commentsEnabled) return { kind: "disabled" };

    let parent: { id: string; authorId: string | null } | null = null;
    if (input.parentId) {
      // Une réponse doit appartenir à la même publication et rester visible.
      const parentRows = await tx
        .select({ id: comments.id, authorId: comments.authorId })
        .from(comments)
        .where(and(eq(comments.id, input.parentId), eq(comments.postId, input.postId), eq(comments.status, "VISIBLE")))
        .limit(1);
      parent = parentRows[0] ?? null;
      if (!parent) return { kind: "invalid-parent" };
    }

    const id = randomUUID();
    const now = new Date();
    await tx.insert(comments).values({
      id,
      postId: input.postId,
      authorId: input.author.id,
      authorUsername: input.author.username,
      authorAvatarUrl: input.author.avatarUrl,
      parentId: input.parentId,
      body: input.body,
      status: "VISIBLE",
      createdAt: now,
      updatedAt: now,
    });
    await tx.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, input.postId));

    const actor = { id: input.author.id, username: input.author.username, avatarUrl: input.author.avatarUrl };
    const postSnapshot = { id: target.id, title: target.title };
    if (parent) {
      // Réponse : notification REPLY à l'auteur du parent (jamais à soi-même).
      if (parent.authorId && parent.authorId !== input.author.id) {
        await notify(parent.authorId, "REPLY", actor, postSnapshot, tx);
      }
    } else if (target.authorId && target.authorId !== input.author.id) {
      await notify(target.authorId, "COMMENT", actor, postSnapshot, tx);
    }

    return {
      kind: "created",
      comment: {
        id,
        postId: input.postId,
        authorId: input.author.id,
        authorUsername: input.author.username,
        authorAvatarUrl: input.author.avatarUrl,
        parentId: input.parentId,
        body: input.body,
        status: "VISIBLE",
        createdAt: now.toISOString(),
        likeCount: 0,
        likedByMe: false,
      },
    };
  });
  await invalidateCatalog();
  return result;
}

export async function hideComment(commentId: string, actor: AuthUser): Promise<"ok" | "not-found" | "forbidden"> {
  const db = getDatabase();
  const result = await db.transaction(async (tx) => {
    const row = await tx
      .select({ id: comments.id, postId: comments.postId, authorId: comments.authorId, status: comments.status })
      .from(comments)
      .where(eq(comments.id, commentId))
      .for("update")
      .limit(1);
    if (row.length === 0) return "not-found";
    const comment = row[0]!;
    const postRows = await tx.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, comment.postId)).limit(1);
    const postAuthor = postRows[0]?.authorId ?? null;
    const canHide = actor.role === "admin" || actor.role === "moderator" || actor.id === comment.authorId || actor.id === postAuthor;
    if (!canHide) return "forbidden";
    // Décision éditoriale : l'auteur masque son propre commentaire ; sinon modération (admin, modérateur ou auteur du texte).
    const nextStatus = actor.id === comment.authorId ? ("HIDDEN_BY_AUTHOR" as const) : ("HIDDEN_BY_MOD" as const);
    // N'agit que sur une transition depuis VISIBLE : le compteur ne décrémente qu'une fois, même si l'appel est répété.
    const updated = await tx
      .update(comments)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(and(eq(comments.id, commentId), eq(comments.status, "VISIBLE")))
      .returning({ id: comments.id });
    if (updated.length > 0) {
      await tx
        .update(posts)
        .set({ commentCount: sql`greatest(${posts.commentCount} - 1, 0)` })
        .where(eq(posts.id, comment.postId));
    }
    return "ok";
  });
  await invalidateCatalog();
  return result;
}

async function insertNotification(entry: {
  userId: string;
  type: NotificationKind;
  actorUsername: string;
  actorAvatarUrl: string;
  actorId: string | null;
  postId: string | null;
  postTitle: string;
}, tx?: DbTx): Promise<void> {
  if (entry.actorId && entry.userId === entry.actorId) return; // Pas de notification pour soi-même.
  const client = tx ?? getDatabase();
  await client.insert(notifications).values({
    id: randomUUID(),
    userId: entry.userId,
    actorId: entry.actorId,
    type: entry.type,
    actorUsername: entry.actorUsername,
    actorAvatarUrl: entry.actorAvatarUrl,
    postId: entry.postId,
    postTitle: entry.postTitle,
    readAt: null,
    createdAt: new Date(),
  });
}

async function notify(userId: string, type: NotificationKind, actor: { id: string; username: string; avatarUrl: string }, post: { id: string; title: string }, tx?: DbTx): Promise<void> {
  if (userId === actor.id) return;
  await insertNotification({ userId, type, actorUsername: actor.username, actorAvatarUrl: actor.avatarUrl, actorId: actor.id, postId: post.id, postTitle: post.title }, tx);
}

/* -------------------------------- Notifications -------------------------------- */

export async function listNotifications(userId: string): Promise<NotificationItem[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationKind,
    actorUsername: row.actorUsername,
    actorAvatarUrl: row.actorAvatarUrl,
    postTitle: row.postTitle,
    postId: row.postId ?? "",
    read: Boolean(row.readAt),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function markNotificationsRead(userId: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const db = getDatabase();
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), inArray(notifications.id, ids), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return rows.length;
}

/* ------------------------------- Modération / audit ------------------------------- */

export async function listReports(): Promise<ReportItem[]> {
  const db = getDatabase();
  const rows = await db.select().from(reports).orderBy(desc(reports.priority), desc(reports.createdAt));
  return rows.map((row) => ({
    id: row.id,
    reporterId: row.reporterId ?? "",
    targetType: row.targetType as ReportTargetType,
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    reason: row.reason as ReportReason,
    details: row.details,
    priority: row.priority,
    status: row.status as ReportItem["status"],
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createReport(input: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  details: string;
}): Promise<ReportItem | "duplicate"> {
  const db = getDatabase();
  const existing = await db.select({ id: reports.id }).from(reports).where(and(eq(reports.reporterId, input.reporterId), eq(reports.targetType, input.targetType), eq(reports.targetId, input.targetId))).limit(1);
  if (existing.length > 0) return "duplicate";
  const id = randomUUID();
  const insertedRows = await db
    .insert(reports)
    .values({
      id,
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      reason: input.reason,
      details: input.details,
      priority: input.reason === "DANGER" ? 2 : 0,
      status: "OPEN",
      createdAt: new Date(),
      reviewedAt: null,
    })
    .returning();
  const row = insertedRows[0]!;
  return {
    id: row.id,
    reporterId: row.reporterId ?? "",
    targetType: row.targetType as ReportTargetType,
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    reason: row.reason as ReportReason,
    details: row.details,
    priority: row.priority,
    status: row.status as ReportItem["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function setReportStatus(id: string, status: "RESOLVED" | "DISMISSED"): Promise<boolean> {
  const db = getDatabase();
  const rows = await db
    .update(reports)
    .set({ status, reviewedAt: new Date() })
    .where(eq(reports.id, id))
    .returning({ id: reports.id });
  return rows.length > 0;
}

export async function listAudit(): Promise<AuditEntry[]> {
  const db = getDatabase();
  const rows = await db.select().from(adminAudit).orderBy(desc(adminAudit.createdAt)).limit(200);
  return rows.map((row) => ({
    id: row.id,
    actorUsername: row.actorUsername,
    action: row.action,
    targetLabel: row.targetLabel,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Résout le userId à partir du pseudonyme (l'id interne n'est pas le pseudonyme). */
async function actorIdByUsername(tx: DbTx, actorUsername: string): Promise<string | null> {
  const target = normalizeSearchText(actorUsername);
  if (!target) return null;
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .innerJoin(authorProfiles, eq(authorProfiles.userId, users.id))
    .where(sql`lower(${authorProfiles.usernameNormalized}) = ${target}`)
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function pushAudit(actorUsername: string, action: string, targetLabel: string, reason: string): Promise<AuditEntry> {
  const db = getDatabase();
  const createdAt = new Date();
  const id = randomUUID();
  return db.transaction(async (tx) => {
    const actorId = await actorIdByUsername(tx, actorUsername);
    await tx.insert(adminAudit).values({ id, actorId, actorUsername, action, targetLabel, reason, createdAt });
    return { id, actorUsername, action, targetLabel, reason, createdAt: createdAt.toISOString() };
  });
}

export async function getSettings(): Promise<SiteSettings> {
  const db = getDatabase();
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  const row = rows[0];
  return row
    ? { maxChars: row.maxChars, minChars: row.minChars, maxTags: row.maxTags, dailyPublishLimit: row.dailyPublishLimit }
    : { maxChars: 50000, minChars: 20, maxTags: 5, dailyPublishLimit: 10 };
}

export async function updateSettings(next: SiteSettings, updatedBy?: string | null): Promise<SiteSettings> {
  const db = getDatabase();
  await db
    .insert(siteSettings)
    .values({ id: 1, maxChars: next.maxChars, minChars: next.minChars, maxTags: next.maxTags, dailyPublishLimit: next.dailyPublishLimit, updatedBy: updatedBy ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.id, set: { maxChars: next.maxChars, minChars: next.minChars, maxTags: next.maxTags, dailyPublishLimit: next.dailyPublishLimit, updatedBy: updatedBy ?? null, updatedAt: new Date() } });
  return { maxChars: next.maxChars, minChars: next.minChars, maxTags: next.maxTags, dailyPublishLimit: next.dailyPublishLimit };
}

export async function adminModerate(input: {
  actorUsername: string;
  reportId: string;
  targetId: string;
  targetLabel: string;
  action: "HIDE" | "RESTORE" | "DISMISS";
  reason: string;
}): Promise<void> {
  const db = getDatabase();
  // Masquer/restaurer + clôture du signalement + audit : tout ou rien.
  await db.transaction(async (tx) => {
    if (input.action === "HIDE") {
      await tx.update(posts).set({ status: "HIDDEN", moderationLocked: true, updatedAt: new Date() }).where(eq(posts.id, input.targetId));
      await tx.update(reports).set({ status: "RESOLVED", reviewedAt: new Date() }).where(eq(reports.id, input.reportId));
    } else if (input.action === "RESTORE") {
      await tx.update(posts).set({ status: "PUBLISHED", moderationLocked: false, updatedAt: new Date() }).where(eq(posts.id, input.targetId));
      await tx.update(reports).set({ status: "RESOLVED", reviewedAt: new Date() }).where(eq(reports.id, input.reportId));
    } else {
      await tx.update(reports).set({ status: "DISMISSED", reviewedAt: new Date() }).where(eq(reports.id, input.reportId));
    }
    const actorId = await actorIdByUsername(tx, input.actorUsername);
    await tx.insert(adminAudit).values({
      id: randomUUID(),
      actorId,
      actorUsername: input.actorUsername,
      action: input.action,
      targetLabel: input.targetLabel,
      reason: input.reason,
      createdAt: new Date(),
    });
  });
  await invalidateCatalog();
}

/* ----------------------------- Compteurs dynamiques ----------------------------- */

/** Score d'engagement utilisé pour le tri "Populaires" (j'aime ×3, commentaires ×5, vues ×0.5). */
export function popularityScore(post: PostRecord): number {
  return post.likeCount * 3 + post.commentCount * 5 + Math.round(post.viewCount * 0.5);
}

export async function countPublishedPostsByAuthor(authorId: string): Promise<number> {
  const db = getDatabase();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.authorId, authorId), eq(posts.status, "PUBLISHED")));
  return rows[0]?.count ?? 0;
}

export async function countPublishedPostsByTheme(themeId: string): Promise<number> {
  const db = getDatabase();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postThemes)
    .innerJoin(posts, eq(posts.id, postThemes.postId))
    .where(and(eq(postThemes.themeId, themeId), eq(posts.status, "PUBLISHED")));
  return rows[0]?.count ?? 0;
}

export async function countFollowers(userId: string): Promise<number> {
  const db = getDatabase();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followedId, userId));
  return rows[0]?.count ?? 0;
}

async function withAuthorStats(row: AuthorRowFlat): Promise<AuthorProfile> {
  const [postCount, followersCount] = await Promise.all([
    countPublishedPostsByAuthor(row.userId),
    countFollowers(row.userId),
  ]);
  return {
    userId: row.userId,
    username: row.username,
    firstName: row.firstName || undefined,
    lastName: row.lastName || undefined,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    defaultPublishAs: row.defaultPublishAs as PublishAs,
    listedInDirectory: row.listedInDirectory,
    showJoinDate: row.showJoinDate,
    postCount,
    followersCount,
    joinedAt: row.createdAt.toISOString(),
    status: row.status as AuthorProfile["status"],
  };
}

const authorRowColumns = {
  userId: authorProfiles.userId,
  username: authorProfiles.username,
  usernameNormalized: authorProfiles.usernameNormalized,
  firstName: authorProfiles.firstName,
  lastName: authorProfiles.lastName,
  bio: authorProfiles.bio,
  avatarUrl: authorProfiles.avatarUrl,
  defaultPublishAs: authorProfiles.defaultPublishAs,
  listedInDirectory: authorProfiles.listedInDirectory,
  showJoinDate: authorProfiles.showJoinDate,
  status: authorProfiles.status,
  createdAt: authorProfiles.createdAt,
  updatedAt: authorProfiles.updatedAt,
  role: users.role,
  onboarded: users.onboarded,
};

type AuthorRowFlat = {
  userId: string;
  username: string;
  usernameNormalized: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string;
  defaultPublishAs: string;
  listedInDirectory: boolean;
  showJoinDate: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  role: "user" | "moderator" | "admin";
  onboarded: boolean;
};

async function findAuthorRows(): Promise<AuthorRowFlat[]> {
  const db = getDatabase();
  return db.select(authorRowColumns).from(authorProfiles).innerJoin(users, eq(users.id, authorProfiles.userId)) as Promise<AuthorRowFlat[]>;
}

/* ----------------------------------- Recherche ----------------------------------- */

async function searchUncached(query: string, tab: SearchTab, viewerId?: string | null): Promise<SearchResponse> {
  const db = getDatabase();
  const clean = normalizeSearchText(query);
  const items: SearchResultItem[] = [];

  if (tab === "all" || tab === "posts") {
    const limit = 20;
    const raw = query.trim().slice(0, 120);
    // Recherche plein-texte française (index GIN posts_fts_fr), filtrée par visibilité.
    const visCond = viewerId
      ? or(eq(posts.visibility, "PUBLIC"), eq(posts.authorId, viewerId))!
      : eq(posts.visibility, "PUBLIC");
    // Requête brute (non normalisée) : le stemmer français gère accents et pluriels.
    const tsvector = sql`to_tsvector('french', coalesce(${posts.title},'') || ' ' || coalesce(${posts.excerpt},'') || ' ' || coalesce(${posts.contentText},''))`;
    const tsquery = sql`websearch_to_tsquery('french', ${raw})`;
    const postRows = await db
      .select(postColumns)
      .from(posts)
      .where(and(eq(posts.status, "PUBLISHED"), visCond, sql`${tsvector} @@ ${tsquery}`))
      .orderBy(desc(sql`ts_rank(${tsvector}, ${tsquery})`), desc(posts.publishedAt))
      .limit(limit);
    const summaries = await mapSummaries(postRows);
    for (const p of summaries) {
      items.push({ id: p.id, kind: "post", title: p.title, subtitle: `Par ${p.authorUsername}`, href: `/mots/${p.id}`, imageUrl: p.heroImageUrl });
    }
  }
  if (tab === "all" || tab === "themes") {
    const rows = await db.select().from(themes).where(eq(themes.active, true)).orderBy(asc(themes.position)).limit(100);
    for (const t of rows) {
      if (isFuzzyMatch(`${t.name} ${t.tagline}`, clean)) {
        items.push({ id: t.id, kind: "theme", title: `Thème : ${t.name}`, subtitle: `${formatCount(0)} publications`, href: `/themes/${t.id}` });
      }
    }
  }
  if (tab === "all" || tab === "authors") {
    const rows = await db
      .select(authorRowColumns)
      .from(authorProfiles)
      .innerJoin(users, eq(users.id, authorProfiles.userId))
      .where(and(eq(authorProfiles.status, "ACTIVE"), eq(authorProfiles.listedInDirectory, true)))
      .limit(50);
    for (const a of rows as unknown as AuthorRowFlat[]) {
      if (isFuzzyMatch(`${a.username} ${a.bio}`, clean)) {
        items.push({ id: a.userId, kind: "author", title: a.username, subtitle: "Auteur", href: `/auteurs/${a.userId}`, imageUrl: a.avatarUrl });
      }
    }
  }
  if (tab === "all" || tab === "tags") {
    const rows = await db.select().from(tags).where(eq(tags.status, "APPROVED")).limit(100);
    for (const g of rows) {
      if (isFuzzyMatch(g.label, clean)) {
        items.push({ id: g.id, kind: "tag", title: `#${g.label}`, subtitle: "", href: `/tags/${g.id}` });
      }
    }
  }

  // Enrichit les thèmes avec le vrai compteur de publications
  const themeIds = items.filter((item) => item.kind === "theme").map((item) => item.id);
  if (themeIds.length > 0) {
    const counts = await db
      .select({ themeId: postThemes.themeId, count: sql<number>`count(*)::int` })
      .from(postThemes)
      .innerJoin(posts, eq(posts.id, postThemes.postId))
      .where(and(inArray(postThemes.themeId, themeIds), eq(posts.status, "PUBLISHED")))
      .groupBy(postThemes.themeId);
    const countByTheme = new Map(counts.map((c) => [c.themeId, c.count]));
    for (const item of items) {
      if (item.kind === "theme") item.subtitle = `${formatCount(countByTheme.get(item.id) ?? 0)} publications`;
    }
  }

  // Enrichit les auteurs avec le vrai compteur de publications
  const authorIds = items.filter((item) => item.kind === "author").map((item) => item.id);
  if (authorIds.length > 0) {
    const counts = await db
      .select({ authorId: posts.authorId, count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(inArray(posts.authorId, authorIds), eq(posts.status, "PUBLISHED")))
      .groupBy(posts.authorId);
    const countByAuthor = new Map(counts.map((c) => [c.authorId, c.count]));
    for (const item of items) {
      if (item.kind === "author") item.subtitle = `Auteur · ${formatCount(countByAuthor.get(item.id) ?? 0)} publications`;
    }
  }

  return { total: items.length, items };
}

/* ----------------------------------- Tags ------------------------------------ */

async function listTagsUncached(): Promise<TagItem[]> {
  return withCatalogCache("tags:list", async () => {
    const db = getDatabase();
    const rows = await db
      .select({
        id: tags.id,
        label: tags.label,
        status: tags.status,
        useCount: sql<number>`count(${postTags.postId})::int`,
      })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .where(eq(tags.status, "APPROVED"))
      .groupBy(tags.id, tags.label, tags.status)
      .orderBy(desc(sql`count(${postTags.postId})`));
    return rows.map((row) => ({ id: row.id, label: row.label, useCount: row.useCount, status: row.status as TagItem["status"] }));
  });
}

async function getTagByIdUncached(id: string): Promise<TagItem | null> {
  if (!isUuid(id)) return null;
  return withCatalogCache(`tags:item:${id}`, async () => {
    const db = getDatabase();
    const rows = await db
      .select({
        id: tags.id,
        label: tags.label,
        status: tags.status,
        useCount: sql<number>`count(${postTags.postId})::int`,
      })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .where(and(eq(tags.status, "APPROVED"), eq(tags.id, id)))
      .groupBy(tags.id, tags.label, tags.status)
      .limit(1);
    const row = rows[0];
    return row ? { id: row.id, label: row.label, useCount: row.useCount, status: row.status as TagItem["status"] } : null;
  });
}

export async function suggestTagsFromText(text: string): Promise<string[]> {
  const norm = normalizeSearchText(text);
  const db = getDatabase();
  const rows = await db
    .select({ label: tags.label })
    .from(tags)
    .where(eq(tags.status, "APPROVED"));
  const matched = rows.filter((t) => norm.includes(normalizeSearchText(t.label))).map((t) => t.label);
  const defaults = ["Amour", "Solitude", "Vie", "Espoir"];
  return Array.from(new Set([...matched, ...defaults])).slice(0, 5);
}

/* ---------------------------------- Thèmes ----------------------------------- */

async function loadThemePostCounts(): Promise<Map<string, number>> {
  const db = getDatabase();
  const rows = await db
    .select({ themeId: postThemes.themeId, count: sql<number>`count(*)::int` })
    .from(postThemes)
    .innerJoin(posts, eq(posts.id, postThemes.postId))
    .where(eq(posts.status, "PUBLISHED"))
    .groupBy(postThemes.themeId);
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.themeId, row.count);
  return map;
}

async function listThemesUncached(query?: string): Promise<ThemeItem[]> {
  const clean = normalizeSearchText(query ?? "");
  return withCatalogCache(`themes:list:${clean || "all"}`, async () => {
    const db = getDatabase();
    const [rows, counts] = await Promise.all([
    db.select().from(themes).where(eq(themes.active, true)).orderBy(asc(themes.position)),
    loadThemePostCounts(),
  ]);
  return rows
    .filter((theme) => !clean || normalizeSearchText(theme.name).includes(clean) || normalizeSearchText(theme.tagline).includes(clean))
      .map((theme) => ({
        id: theme.id,
        name: theme.name,
        category: theme.category as ThemeCategory,
        tagline: theme.tagline,
        position: theme.position,
        postCount: counts.get(theme.id) ?? 0,
        tagCount: 0,
        active: theme.active,
      }));
  });
}

async function getThemeByIdUncached(id: string): Promise<ThemeItem | null> {
  if (!isUuid(id)) return null;
  return withCatalogCache(`themes:item:${id}`, async () => {
    const db = getDatabase();
    const rows = await db.select().from(themes).where(and(eq(themes.id, id), eq(themes.active, true))).limit(1);
    const row = rows[0];
    if (!row) return null;
    const counts = await loadThemePostCounts();
    return {
      id: row.id,
      name: row.name,
      category: row.category as ThemeCategory,
      tagline: row.tagline,
      position: row.position,
      postCount: counts.get(row.id) ?? 0,
      tagCount: 0,
      active: row.active,
    };
  });
}

/* ---------------------------------- Auteurs ----------------------------------- */

async function listAuthorsUncached(query?: string): Promise<AuthorProfile[]> {
  const db = getDatabase();
  const clean = normalizeSearchText(query ?? "");
  const rows = await db
    .select(authorRowColumns)
    .from(authorProfiles)
    .innerJoin(users, eq(users.id, authorProfiles.userId))
    .where(and(eq(authorProfiles.status, "ACTIVE"), eq(authorProfiles.listedInDirectory, true)));

  const filtered = (rows as unknown as AuthorRowFlat[]).filter((a) => {
    if (!clean) return true;
    return normalizeSearchText(a.username).includes(clean) || normalizeSearchText(a.bio).includes(clean);
  });

  const userIds = filtered.map((a) => a.userId);
  const postCounts = new Map<string, number>();
  const followCounts = new Map<string, number>();

  if (userIds.length > 0) {
    const [postResult, followResult] = await Promise.all([
      db
        .select({ authorId: posts.authorId, count: sql<number>`count(*)::int` })
        .from(posts)
        .where(and(inArray(posts.authorId, userIds), eq(posts.status, "PUBLISHED")))
        .groupBy(posts.authorId),
      db
        .select({ followedId: userFollows.followedId, count: sql<number>`count(*)::int` })
        .from(userFollows)
        .where(inArray(userFollows.followedId, userIds))
        .groupBy(userFollows.followedId),
    ]);
    for (const row of postResult) postCounts.set(row.authorId ?? "", row.count);
    for (const row of followResult) followCounts.set(row.followedId, row.count);
  }

  return filtered
    .map((a) => ({
      userId: a.userId,
      username: a.username,
      firstName: a.firstName || undefined,
      lastName: a.lastName || undefined,
      bio: a.bio,
      avatarUrl: a.avatarUrl,
      defaultPublishAs: a.defaultPublishAs as PublishAs,
      listedInDirectory: a.listedInDirectory,
      showJoinDate: a.showJoinDate,
      postCount: postCounts.get(a.userId) ?? 0,
      followersCount: followCounts.get(a.userId) ?? 0,
      joinedAt: a.createdAt.toISOString(),
      status: a.status as AuthorProfile["status"],
    }))
    .sort((a, b) => (b.followersCount + b.postCount * 2) - (a.followersCount + a.postCount * 2));
}

async function getAuthorByIdUncached(id: string): Promise<AuthorProfile | null> {
  if (!isUuid(id)) return null;
  const db = getDatabase();
  const rows = await db
    .select(authorRowColumns)
    .from(authorProfiles)
    .innerJoin(users, eq(users.id, authorProfiles.userId))
    .where(and(eq(authorProfiles.userId, id), eq(authorProfiles.status, "ACTIVE")))
    .limit(1);
  const row = (rows as unknown as AuthorRowFlat[])[0];
  if (!row) return null;
  const [postResult, followResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.authorId, id), eq(posts.status, "PUBLISHED"))),
    db.select({ count: sql<number>`count(*)::int` }).from(userFollows).where(eq(userFollows.followedId, id)),
  ]);
  return {
    userId: row.userId,
    username: row.username,
    firstName: row.firstName || undefined,
    lastName: row.lastName || undefined,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    defaultPublishAs: row.defaultPublishAs as PublishAs,
    listedInDirectory: row.listedInDirectory,
    showJoinDate: row.showJoinDate,
    postCount: postResult[0]?.count ?? 0,
    followersCount: followResult[0]?.count ?? 0,
    joinedAt: row.createdAt.toISOString(),
    status: row.status as AuthorProfile["status"],
  };
}

/* ------------------------------- Suppression de compte ------------------------------ */

export async function deleteAccount(userId: string): Promise<void> {
  const db = getDatabase();
  // Tout ou rien. Les dépendances privées (profil, OAuth, sessions, suivis, blocages,
  // réactions, favoris, likes de commentaires, notifications destinataire) sont cascadées
  // par les FK ; les auteurs sont préservés en snapshot (posts/comments.author_id → set null),
  // les actes d'audit et signalements sont anonymisés (set null).
  await db.transaction(async (tx) => {
    await tx.update(posts).set({ status: "DELETED" as const, updatedAt: new Date() }).where(eq(posts.authorId, userId));
    await tx.update(comments).set({ status: "DELETED" as const, updatedAt: new Date() }).where(eq(comments.authorId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
  await invalidateCatalog();
}

/** Nombre de brouillons d'un auteur (limite produit : 50). */
export async function countDraftsByAuthor(authorId: string): Promise<number> {
  const db = getDatabase();
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.authorId, authorId), eq(posts.status, "DRAFT")));
  return rows[0]?.count ?? 0;
}

/** Force le rôle admin (bootstrap par email, ex. ADMIN_EMAILS). */
export async function setAdminRoleForUser(userId: string): Promise<void> {
  const db = getDatabase();
  await db.update(users).set({ role: "admin" }).where(eq(users.id, userId));
}

/* ---------------------------------------------------------------------------
 * Data Cache applicatif (Next.js unstable_cache).
 * Chaque lecture publique passe par un wrapper qui (a) tente le cache Next, et
 * (b) retombe sur l'implémentation directe hors runtime Next (script seed,
 * tsx). Invalidation globale via le tag `qm-catalog`.
 * ------------------------------------------------------------------------- */
const CACHE_TAG = ["qm-catalog"] as const;
const FEED_TAG = ["qm-catalog", "qm-feed"] as const;

function safeCached<TArgs extends readonly unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  key: readonly string[],
  revalidate: number,
  tags: readonly string[],
): (...args: TArgs) => Promise<TResult> {
  let wrapped: ((...args: TArgs) => Promise<TResult>) | null = null;
  try {
    wrapped = unstable_cache(fn, [...key], { revalidate, tags: [...tags] }) as unknown as (...args: TArgs) => Promise<TResult>;
  } catch {
    wrapped = null; // Hors runtime Next (ex. seed) : on bypass le cache.
  }
  return async (...args: TArgs): Promise<TResult> => {
    if (!wrapped) return fn(...args);
    try {
      return await wrapped(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("incrementalCache missing")) return fn(...args);
      throw error;
    }
  };
}

export const listFeed = safeCached(listFeedUncached, ["listFeed"], 30, FEED_TAG);
export const getPostById = safeCached(getPostByIdUncached, ["getPostById"], 60, CACHE_TAG);
export const getPostsByIds = safeCached(getPostsByIdsUncached, ["getPostsByIds"], 60, CACHE_TAG);
export const listRelated = safeCached(listRelatedUncached, ["listRelated"], 120, CACHE_TAG);
export const search = safeCached(searchUncached, ["search"], 30, CACHE_TAG);
export const listThemes = safeCached(listThemesUncached, ["listThemes"], 120, CACHE_TAG);
export const getThemeById = safeCached(getThemeByIdUncached, ["getThemeById"], 120, CACHE_TAG);
export const listTags = safeCached(listTagsUncached, ["listTags"], 120, CACHE_TAG);
export const getTagById = safeCached(getTagByIdUncached, ["getTagById"], 120, CACHE_TAG);
export const listAuthors = safeCached(listAuthorsUncached, ["listAuthors"], 120, CACHE_TAG);
export const getAuthorById = safeCached(getAuthorByIdUncached, ["getAuthorById"], 120, CACHE_TAG);
