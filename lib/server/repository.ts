/**
 * Référentiels PostgreSQL (Drizzle) pour toute la logique métier de l'application.
 * Chaque fonction lit/écrit la base Neon ; aucun état n'est gardé en mémoire.
 */
import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull, or, sql, asc } from "drizzle-orm";
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

const newId = (prefix: string): string => `${prefix}-${randomUUID()}`;
const today = (): string => new Date().toISOString().slice(0, 10);

type Row<T> = T extends (infer U)[] ? U : never;

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
  slug: posts.slug,
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

function mapPostRow(row: PostRow & { themeSlugs?: string[]; tagSlugs?: string[] }): PostRecord {
  return {
    id: row.id,
    slug: row.slug ?? "",
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
    themeSlugs: row.themeSlugs ?? [],
    tagSlugs: row.tagSlugs ?? [],
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

async function loadPostThemesTags(postId: string): Promise<{ themeSlugs: string[]; tagSlugs: string[] }> {
  const db = getDatabase();
  const [themesRows, tagsRows] = await Promise.all([
    db.select({ slug: themes.slug }).from(postThemes).innerJoin(themes, eq(themes.id, postThemes.themeId)).where(eq(postThemes.postId, postId)),
    db.select({ slug: postTags.tagSlug }).from(postTags).where(eq(postTags.postId, postId)),
  ]);
  return {
    themeSlugs: themesRows.map((r) => r.slug),
    tagSlugs: tagsRows.map((r) => r.slug),
  };
}

async function loadPostsThemesTags(postIds: string[]): Promise<Map<string, { themeSlugs: string[]; tagSlugs: string[] }>> {
  if (postIds.length === 0) return new Map();
  const db = getDatabase();
  const [themeRows, tagRows] = await Promise.all([
    db.select({ postId: postThemes.postId, slug: themes.slug }).from(postThemes).innerJoin(themes, eq(themes.id, postThemes.themeId)).where(inArray(postThemes.postId, postIds)),
    db.select({ postId: postTags.postId, slug: postTags.tagSlug }).from(postTags).where(inArray(postTags.postId, postIds)),
  ]);
  const map = new Map<string, { themeSlugs: string[]; tagSlugs: string[] }>();
  for (const id of postIds) map.set(id, { themeSlugs: [], tagSlugs: [] });
  for (const row of themeRows) map.get(row.postId)?.themeSlugs.push(row.slug);
  for (const row of tagRows) map.get(row.postId)?.tagSlugs.push(row.slug);
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

async function canViewPostWithBlocks(post: { id: string; status: string; visibility: string; authorId: string | null }, viewerId: string | null | undefined, viewerBlockedAuthorIds?: string[]): Promise<boolean> {
  if (post.status === "DELETED" || post.status === "HIDDEN") return false;
  const isOwner = Boolean(viewerId && viewerId === post.authorId);
  if (post.status !== "PUBLISHED") return isOwner;
  if (post.visibility === "PRIVATE") return isOwner;
  return true;
}

/** ID par stable/aléatoire pour les nouveaux comptes démo. */
async function generateUserId(): Promise<string> {
  const db = getDatabase();
  // Boucle rare : collision presque impossible, avec retry préventif.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = `user-${randomUUID().slice(0, 8)}`;
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (existing.length === 0) return id;
  }
  return `user-${randomUUID()}`;
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

export async function createDemoUser(): Promise<AuthUser> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Les comptes de démonstration sont désactivés en production.");
  }
  const db = getDatabase();
  const id = await generateUserId();
  const suffix = randomUUID().slice(0, 6);
  const username = `lecteur-${suffix}`;
  const avatarUrl = "/images/editorial/avatar-emma.jpg";
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id, email: null, role: "user", status: "ACTIVE", onboarded: false });
    await tx.insert(authorProfiles).values({
      userId: id,
      username,
      usernameNormalized: normalizeSearchText(username),
      firstName: "",
      lastName: "",
      bio: "",
      avatarUrl,
      defaultPublishAs: "USERNAME",
      listedInDirectory: true,
      showJoinDate: true,
      status: "ACTIVE",
    });
  });
  return (await selectAuthUserById(id))!;
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
    .values({ id: newId("oauth"), userId: input.userId, provider: input.provider, providerAccountId: input.providerAccountId, providerEmail: input.providerEmail })
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
  const id = await generateUserId();
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
    await tx.insert(oauthAccounts).values({ id: newId("oauth"), userId: id, provider: "google", providerAccountId: input.googleSub, providerEmail: input.email });
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
  return selectAuthUserById(userId);
}

/* ----------------------------------- Textes ----------------------------------- */

export async function listFeed(query: FeedQuery): Promise<FeedPage> {
  const db = getDatabase();
  const blockedIds = query.blockedAuthorIds ?? [];
  const conditions = [eq(posts.status, "PUBLISHED")];
  if (query.themeSlug) {
    // Jointure sur post_themes pour filtrer par thème.
    const sub = db
      .select({ postId: postThemes.postId })
      .from(postThemes)
      .innerJoin(themes, eq(themes.slug, postThemes.themeId))
      .where(eq(themes.slug, query.themeSlug));
    conditions.push(inArray(posts.id, sub as unknown as string[]));
  }
  if (query.tagSlug) {
    const sub = db.select({ postId: postTags.postId }).from(postTags).where(eq(postTags.tagSlug, query.tagSlug));
    conditions.push(inArray(posts.id, sub as unknown as string[]));
  }
  if (query.authorUsername) {
    const target = normalizeSearchText(query.authorUsername);
    conditions.push(sql`lower(author_username) = ${target}`);
  }
  if (blockedIds.length > 0) {
    conditions.push(sql`${posts.authorId} NOT IN (${sql.join(blockedIds.map((id) => sql`${id}`), sql`, `)})`);
  }
  const where = conditions.length === 1 ? conditions[0] : and(...conditions);
  const rows = query.sort === "top"
    ? await db.select(postColumns).from(posts).where(where).orderBy(desc(sql`${posts.likeCount} * 3 + ${posts.commentCount} * 5 + ${posts.viewCount} * 0.5`))
    : await db.select(postColumns).from(posts).where(where).orderBy(desc(posts.publishedAt));
  let filtered = await mapPostRowIds(rows);
  filtered = filtered.filter((p) => canViewPost(p, query.viewerId));
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const start = query.cursor
    ? Math.max(0, filtered.findIndex((p) => p.id === query.cursor) + 1)
    : 0;
  const slice = filtered.slice(start, start + limit);
  const nextCursor = start + limit < filtered.length && slice.length > 0 ? (slice[slice.length - 1]?.id ?? null) : null;
  return { items: slice.map(stripPostContent), nextCursor };
}

export async function getPostById(id: string): Promise<PostRecord | null> {
  const db = getDatabase();
  const rows = await db.select(postColumns).from(posts).where(eq(posts.id, id)).limit(1);
  if (rows.length === 0) return null;
  const [mapped] = await mapPostRowIds(rows);
  return mapped ?? null;
}

export async function getPostBySlug(slug: string, viewerId?: string | null): Promise<PostRecord | null> {
  const db = getDatabase();
  const rows = await db.select(postColumns).from(posts).where(eq(posts.slug, slug)).limit(1);
  if (rows.length === 0) return null;
  const [mapped] = await mapPostRowIds(rows);
  if (!mapped) return null;
  return canViewPost(mapped, viewerId) ? mapped : null;
}

export async function getPostsByIds(ids: string[], viewerId?: string | null): Promise<PostSummary[]> {
  if (ids.length === 0) return [];
  const db = getDatabase();
  const rows = await db.select(postColumns).from(posts).where(inArray(posts.id, ids));
  const mapped = await mapPostRowIds(rows);
  const byId = new Map(mapped.map((p) => [p.id, p]));
  return ids.flatMap((id) => {
    const post = byId.get(id);
    return post && canViewPost(post, viewerId) ? [stripPostContent(post)] : [];
  });
}

export async function listRelated(post: PostRecord, viewerId?: string | null): Promise<PostSummary[]> {
  if (post.themeSlugs.length === 0) return [];
  const db = getDatabase();
  const rows = await db
    .selectDistinctOn([posts.id], postColumns)
    .from(posts)
    .innerJoin(postThemes, eq(postThemes.postId, posts.id))
    .innerJoin(themes, eq(themes.id, postThemes.themeId))
    .where(and(
      eq(posts.status, "PUBLISHED"),
      sql`${posts.id} <> ${post.id}`,
      inArray(themes.slug, post.themeSlugs),
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

function toSlug(title: string, id: string): string {
  const base = normalizeSearchText(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "texte"}-${id.slice(-4)}`;
}

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
      if (draft.themeSlugs !== undefined) {
        await tx.delete(postThemes).where(eq(postThemes.postId, existing.id));
        await replacePostThemes(tx, existing.id, draft.themeSlugs);
      }
      if (draft.tagSlugs !== undefined) {
        await tx.delete(postTags).where(eq(postTags.postId, existing.id));
        await replacePostTags(tx, existing.id, draft.tagSlugs);
      }
    });
    const updated = await getPostById(existing.id);
    if (!updated) throw new Error("Brouillon devenu indisponible.");
    return updated;
  }

  // Création
  const id = newId("draft");
  await db.transaction(async (tx) => {
    await tx.insert(posts).values({
      id,
      slug: null,
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
    if (draft.themeSlugs) await replacePostThemes(tx, id, draft.themeSlugs);
    if (draft.tagSlugs) await replacePostTags(tx, id, draft.tagSlugs);
  });
  const created = await getPostById(id);
  if (!created) throw new Error("Création du brouillon impossible.");
  return created;
}

async function replacePostThemes(tx: unknown, postId: string, themeSlugs: string[]): Promise<void> {
  const typedTx = tx as ReturnType<typeof getDatabase>;
  await typedTx.delete(postThemes).where(eq(postThemes.postId, postId));
  if (themeSlugs.length === 0) return;
  const themeRows = await typedTx
    .select({ id: themes.id, slug: themes.slug })
    .from(themes)
    .where(inArray(themes.slug, themeSlugs));
  const bySlug = new Map<string, string>(themeRows.map((r) => [r.slug, r.id]));
  const valid = themeSlugs.flatMap((slug) => {
    const id = bySlug.get(slug);
    return id ? [{ postId, themeId: id }] : [];
  });
  if (valid.length === 0) return;
  await typedTx.insert(postThemes).values(valid);
}

async function replacePostTags(tx: unknown, postId: string, tagSlugs: string[]): Promise<void> {
  const typedTx = tx as ReturnType<typeof getDatabase>;
  await typedTx.delete(postTags).where(eq(postTags.postId, postId));
  if (tagSlugs.length === 0) return;
  const existing = await typedTx.select({ slug: tags.slug }).from(tags).where(inArray(tags.slug, tagSlugs));
  const existingSet = new Set(existing.map((r) => r.slug));
  const newTags = tagSlugs.filter((slug) => !existingSet.has(slug));
  if (newTags.length > 0) {
    await typedTx
      .insert(tags)
      .values(newTags.map((slug) => ({ slug, label: slug, status: "APPROVED" as const, createdBy: null })))
      .onConflictDoNothing({ target: tags.slug });
  }
  await typedTx
    .insert(postTags)
    .values(tagSlugs.map((slug) => ({ postId, tagSlug: slug })))
    .onConflictDoNothing({ target: [postTags.postId, postTags.tagSlug] });
}

export async function publishPost(id: string, authorId: string): Promise<PostRecord | null> {
  const db = getDatabase();
  const rows = await db.select(postColumns).from(posts).where(and(eq(posts.id, id), eq(posts.authorId, authorId))).limit(1);
  if (rows.length === 0) return null;
  const target = rows[0]!;
  if (target.status !== "DRAFT" && target.status !== "UNDER_REVIEW") return null;
  const slug = target.slug ?? toSlug(target.title, target.id);
  const now = new Date();
  const nextStatus = target.moderationLocked ? "UNDER_REVIEW" : "PUBLISHED";
  await db.update(posts).set({
    status: nextStatus,
    slug,
    publishedAt: target.publishedAt ?? now,
    updatedAt: now,
  }).where(eq(posts.id, id));
  return getPostById(id);
}

export async function countPublishedToday(authorId: string): Promise<number> {
  const db = getDatabase();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.authorId, authorId), eq(posts.status, "PUBLISHED"), sql`${posts.publishedAt} >= ${start}`));
  return rows[0]?.count ?? 0;
}

export async function deletePost(id: string, authorId: string, isAdmin: boolean): Promise<boolean> {
  const db = getDatabase();
  const where = isAdmin
    ? eq(posts.id, id)
    : and(eq(posts.id, id), eq(posts.authorId, authorId));
  const rows = await db.update(posts).set({ status: "DELETED" as const, updatedAt: new Date() }).where(where).returning({ id: posts.id });
  return rows.length > 0;
}

export async function setModerationStatus(id: string, status: PostStatus, locked: boolean): Promise<void> {
  const db = getDatabase();
  await db.update(posts).set({ status, moderationLocked: locked, updatedAt: new Date() }).where(eq(posts.id, id));
}

export async function adjustCounter(
  id: string,
  field: "likeCount" | "dislikeCount" | "commentCount" | "bookmarkCount" | "viewCount",
  delta: number,
): Promise<void> {
  const db = getDatabase();
  const column = { likeCount: posts.likeCount, dislikeCount: posts.dislikeCount, commentCount: posts.commentCount, bookmarkCount: posts.bookmarkCount, viewCount: posts.viewCount }[field];
  if (!column) return;
  await db.update(posts).set(
    delta >= 0
      ? { [field]: sql`${column} + ${delta}` }
      : { [field]: sql`greatest(${column} + ${delta}, 0)` },
  ).where(eq(posts.id, id));
}

/* --------------------------------- Interactions --------------------------------- */

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

async function postReactionInsertOrDelete(userId: string, postId: string, reaction: "LIKE" | "DISLIKE", shouldAdd: boolean): Promise<void> {
  const db = getDatabase();
  if (shouldAdd) {
    await db.insert(postReactions).values({ userId, postId, reaction }).onConflictDoNothing({ target: [postReactions.userId, postReactions.postId] });
    await db.update(posts).set({ [reaction === "LIKE" ? "likeCount" : "dislikeCount"]: sql`${reaction === "LIKE" ? posts.likeCount : posts.dislikeCount} + 1` }).where(eq(posts.id, postId));
  } else {
    await db.delete(postReactions).where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId), eq(postReactions.reaction, reaction)));
    await db.update(posts).set({ [reaction === "LIKE" ? "likeCount" : "dislikeCount"]: sql`greatest(${reaction === "LIKE" ? posts.likeCount : posts.dislikeCount} - 1, 0)` }).where(eq(posts.id, postId));
  }
}

async function otherReactionDelete(userId: string, postId: string, reaction: "LIKE" | "DISLIKE"): Promise<void> {
  const db = getDatabase();
  await db.delete(postReactions).where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId), eq(postReactions.reaction, reaction)));
  await db.update(posts).set({ [reaction === "LIKE" ? "likeCount" : "dislikeCount"]: sql`greatest(${reaction === "LIKE" ? posts.likeCount : posts.dislikeCount} - 1, 0)` }).where(eq(posts.id, postId));
}

export async function toggleLike(userId: string, postId: string): Promise<{ liked: boolean }> {
  const db = getDatabase();
  const rows = await db.select(postColumns).from(posts).where(and(eq(posts.id, postId), sql`${posts.status} <> 'DELETED'`)).limit(1);
  if (rows.length === 0) return { liked: false };
  const existing = await db.select({ reaction: postReactions.reaction }).from(postReactions).where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId))).limit(1);
  const liked = !(existing[0]?.reaction === "LIKE");
  if (liked && existing[0]?.reaction === "DISLIKE") {
    // Le « j'aime » déplace la réaction DISLIKE → LIKE
    await otherReactionDelete(userId, postId, "DISLIKE");
    await postReactionInsertOrDelete(userId, postId, "LIKE", true);
  } else if (liked) {
    await postReactionInsertOrDelete(userId, postId, "LIKE", true);
  } else {
    await postReactionInsertOrDelete(userId, postId, "LIKE", false);
  }
  if (liked) {
    const post = rows[0]!;
    const author = post.authorId ? await findUserById(post.authorId) : null;
    if (author) {
      await notify(post.authorId!, "LIKE", author, post);
    }
  }
  return { liked };
}

export async function toggleDislike(userId: string, postId: string): Promise<{ disliked: boolean }> {
  const db = getDatabase();
  const existing = await db.select({ reaction: postReactions.reaction }).from(postReactions).where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId))).limit(1);
  const disliked = !(existing[0]?.reaction === "DISLIKE");
  if (disliked && existing[0]?.reaction === "LIKE") {
    await otherReactionDelete(userId, postId, "LIKE");
    await postReactionInsertOrDelete(userId, postId, "DISLIKE", true);
  } else if (disliked) {
    await postReactionInsertOrDelete(userId, postId, "DISLIKE", true);
  } else {
    await postReactionInsertOrDelete(userId, postId, "DISLIKE", false);
  }
  return { disliked };
}

export async function toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
  const db = getDatabase();
  const existing = await db.select({ userId: postBookmarks.userId }).from(postBookmarks).where(and(eq(postBookmarks.userId, userId), eq(postBookmarks.postId, postId))).limit(1);
  const bookmarked = existing.length === 0;
  if (bookmarked) {
    await db.insert(postBookmarks).values({ userId, postId }).onConflictDoNothing({ target: [postBookmarks.userId, postBookmarks.postId] });
    await db.update(posts).set({ bookmarkCount: sql`${posts.bookmarkCount} + 1` }).where(eq(posts.id, postId));
  } else {
    await db.delete(postBookmarks).where(and(eq(postBookmarks.userId, userId), eq(postBookmarks.postId, postId)));
    await db.update(posts).set({ bookmarkCount: sql`greatest(${posts.bookmarkCount} - 1, 0)` }).where(eq(posts.id, postId));
  }
  return { bookmarked };
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
  const post = await db.select({ id: posts.id }).from(posts).where(and(eq(posts.id, postId), sql`${posts.status} <> 'DELETED'`)).limit(1);
  if (post.length === 0) return false;
  const dedupeKey = `${postId}:${viewerKey}`;
  const now = new Date();
  const rows = await db
    .select({ lastViewedAt: postViewDedupe.lastViewedAt })
    .from(postViewDedupe)
    .where(and(eq(postViewDedupe.postId, postId), eq(postViewDedupe.viewerHash, viewerKey)))
    .limit(1);
  if (rows[0]?.lastViewedAt && now.getTime() - rows[0].lastViewedAt.getTime() < 90_000) {
    return false;
  }
  await db
    .insert(postViewDedupe)
    .values({ postId, viewerHash: viewerKey, lastViewedAt: now })
    .onConflictDoUpdate({ target: [postViewDedupe.postId, postViewDedupe.viewerHash], set: { lastViewedAt: now } });
  await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, postId));
  return true;
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
  return { following };
}

/* -------------------------------- Commentaires -------------------------------- */

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number } | null> {
  const db = getDatabase();
  const existing = await db.select({ userId: commentLikes.userId }).from(commentLikes).where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId))).limit(1);
  const liked = existing.length === 0;
  if (liked) {
    await db.insert(commentLikes).values({ userId, commentId }).onConflictDoNothing({ target: [commentLikes.userId, commentLikes.commentId] });
  } else {
    await db.delete(commentLikes).where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
  }
  const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(commentLikes).where(eq(commentLikes.commentId, commentId));
  return { liked, likeCount: countRows[0]?.count ?? 0 };
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

export async function addComment(input: {
  postId: string;
  author: AuthUser;
  parentId: string | null;
  body: string;
}): Promise<CommentItemData | null> {
  const db = getDatabase();
  const postRows = await db.select({ id: posts.id, authorId: posts.authorId, commentsEnabled: posts.commentsEnabled }).from(posts).where(and(eq(posts.id, input.postId), eq(posts.status, "PUBLISHED"))).limit(1);
  if (postRows.length === 0) return null;
  const target = postRows[0]!;
  if (!target.commentsEnabled) return null;
  const id = newId("com");
  const now = new Date();
  await db.insert(comments).values({
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
  await adjustCounter(input.postId, "commentCount", 1);
  if (target.authorId && target.authorId !== input.author.id) {
    await insertNotification({
      userId: target.authorId,
      type: "COMMENT",
      actorUsername: input.author.username,
      actorAvatarUrl: input.author.avatarUrl,
      actorId: input.author.id,
      postId: input.postId,
      postTitle: "",
      postSlug: "",
    });
  }
  return {
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
  };
}

export async function hideComment(commentId: string, actor: AuthUser): Promise<"ok" | "not-found" | "forbidden"> {
  const db = getDatabase();
  const row = await db.select({ id: comments.id, postId: comments.postId, authorId: comments.authorId }).from(comments).where(eq(comments.id, commentId)).limit(1);
  if (row.length === 0) return "not-found";
  const comment = row[0]!;
  const postRows = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, comment.postId)).limit(1);
  const postAuthor = postRows[0]?.authorId ?? null;
  const canHide = actor.role === "admin" || actor.id === comment.authorId || actor.id === postAuthor;
  if (!canHide) return "forbidden";
  await db.update(comments).set({ status: "HIDDEN_BY_AUTHOR" as const, updatedAt: new Date() }).where(eq(comments.id, commentId));
  await adjustCounter(comment.postId, "commentCount", -1);
  return "ok";
}

async function insertNotification(entry: {
  userId: string;
  type: NotificationKind;
  actorUsername: string;
  actorAvatarUrl: string;
  actorId: string | null;
  postId: string | null;
  postTitle: string;
  postSlug: string;
}): Promise<void> {
  if (entry.actorId && entry.userId === entry.actorId) return; // Pas de notification pour soi-même.
  const db = getDatabase();
  await db.insert(notifications).values({
    id: newId("notif"),
    userId: entry.userId,
    actorId: entry.actorId,
    type: entry.type,
    actorUsername: entry.actorUsername,
    actorAvatarUrl: entry.actorAvatarUrl,
    postId: entry.postId,
    postTitle: entry.postTitle,
    postSlug: entry.postSlug,
    readAt: null,
    createdAt: new Date(),
  });
}

async function notify(userId: string, type: NotificationKind, actor: { id: string; username: string; avatarUrl: string }, post: { id: string; title: string; slug: string | null }): Promise<void> {
  if (userId === actor.id) return;
  await insertNotification({ userId, type, actorUsername: actor.username, actorAvatarUrl: actor.avatarUrl, actorId: actor.id, postId: post.id, postTitle: post.title, postSlug: post.slug ?? "" });
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
    postSlug: row.postSlug,
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
  const id = newId("rep");
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

export async function pushAudit(actorUsername: string, action: string, targetLabel: string, reason: string): Promise<AuditEntry> {
  const db = getDatabase();
  const actorRows = await db.select({ id: users.id }).from(users).where(eq(users.id, actorUsername)).limit(1);
  const actorId = actorRows[0]?.id ?? null;
  const createdAt = new Date();
  const id = newId("audit");
  await db.insert(adminAudit).values({ id, actorId, actorUsername, action, targetLabel, reason, createdAt });
  return { id, actorUsername, action, targetLabel, reason, createdAt: createdAt.toISOString() };
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
  if (input.action === "HIDE") {
    await setModerationStatus(input.targetId, "HIDDEN", true);
    await setReportStatus(input.reportId, "RESOLVED");
  } else if (input.action === "RESTORE") {
    await setModerationStatus(input.targetId, "PUBLISHED", false);
    await setReportStatus(input.reportId, "RESOLVED");
  } else {
    await setReportStatus(input.reportId, "DISMISSED");
  }
  await db.insert(adminAudit).values({
    id: newId("audit"),
    actorId: null,
    actorUsername: input.actorUsername,
    action: input.action,
    targetLabel: input.targetLabel,
    reason: input.reason,
    createdAt: new Date(),
  });
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

export async function countPublishedPostsByTheme(themeSlug: string): Promise<number> {
  const db = getDatabase();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postThemes)
    .innerJoin(themes, eq(themes.id, postThemes.themeId))
    .innerJoin(posts, eq(posts.id, postThemes.postId))
    .where(and(eq(themes.slug, themeSlug), eq(posts.status, "PUBLISHED")));
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

export async function search(query: string, tab: SearchTab, viewerId?: string | null): Promise<SearchResponse> {
  const db = getDatabase();
  const clean = normalizeSearchText(query);
  const items: SearchResultItem[] = [];

  if (tab === "all" || tab === "posts") {
    const limit = 50;
    const postRows = await db
      .select(postColumns)
      .from(posts)
      .where(eq(posts.status, "PUBLISHED"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
    const summaries = await mapSummaries(postRows);
    for (const p of summaries) {
      if (!viewerId && p.visibility === "PRIVATE") continue;
      if (isFuzzyMatch(`${p.title} ${p.excerpt} ${p.tagSlugs.join(" ")}`, clean)) {
        items.push({ id: p.id, kind: "post", title: p.title, subtitle: `Par ${p.authorUsername} · 2 min`, href: `/mots/${p.id}`, imageUrl: p.heroImageUrl });
      }
    }
  }
  if (tab === "all" || tab === "themes") {
    const rows = await db.select().from(themes).where(eq(themes.active, true)).orderBy(asc(themes.position));
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
      .where(and(eq(authorProfiles.status, "ACTIVE"), eq(authorProfiles.listedInDirectory, true)));
    for (const a of rows as unknown as AuthorRowFlat[]) {
      if (isFuzzyMatch(`${a.username} ${a.bio}`, clean)) {
        items.push({ id: a.userId, kind: "author", title: a.username, subtitle: "Auteur", href: `/auteurs/${a.userId}`, imageUrl: a.avatarUrl });
      }
    }
  }
  if (tab === "all" || tab === "tags") {
    const rows = await db.select().from(tags).where(eq(tags.status, "APPROVED"));
    for (const g of rows) {
      if (isFuzzyMatch(g.label, clean)) {
        items.push({ id: g.slug, kind: "tag", title: `#${g.label}`, subtitle: "", href: `/tags/${g.slug}` });
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

export async function listTags(): Promise<TagItem[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      slug: tags.slug,
      label: tags.label,
      status: tags.status,
      useCount: sql<number>`count(${postTags.postId})::int`,
    })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagSlug, tags.slug))
    .where(eq(tags.status, "APPROVED"))
    .groupBy(tags.slug, tags.label, tags.status)
    .orderBy(desc(sql`count(${postTags.postId})`));
  return rows.map((row) => ({ slug: row.slug, label: row.label, useCount: row.useCount, status: row.status as TagItem["status"] }));
}

export async function getTagBySlug(slug: string): Promise<TagItem | null> {
  const clean = normalizeSearchText(slug);
  const db = getDatabase();
  const rows = await db
    .select({
      slug: tags.slug,
      label: tags.label,
      status: tags.status,
      useCount: sql<number>`count(${postTags.postId})::int`,
    })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagSlug, tags.slug))
    .where(and(eq(tags.status, "APPROVED"), sql`lower(${tags.slug}) = ${clean}`))
    .groupBy(tags.slug, tags.label, tags.status)
    .limit(1);
  const row = rows[0];
  return row ? { slug: row.slug, label: row.label, useCount: row.useCount, status: row.status as TagItem["status"] } : null;
}

export async function suggestTagsFromText(text: string): Promise<string[]> {
  const norm = normalizeSearchText(text);
  const db = getDatabase();
  const rows = await db
    .select({ label: tags.label, slug: tags.slug })
    .from(tags)
    .where(eq(tags.status, "APPROVED"));
  const matched = rows.filter((t) => norm.includes(t.slug)).map((t) => t.label);
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
  const themeIds = rows.map((r) => r.themeId);
  const slugRows = themeIds.length > 0
    ? await db.select({ id: themes.id, slug: themes.slug }).from(themes).where(inArray(themes.id, themeIds))
    : [];
  const idToSlug = new Map(slugRows.map((r) => [r.id, r.slug]));
  const map = new Map<string, number>();
  for (const row of rows) {
    const slug = idToSlug.get(row.themeId);
    if (slug) map.set(slug, row.count);
  }
  return map;
}

export async function listThemes(query?: string): Promise<ThemeItem[]> {
  const db = getDatabase();
  const clean = normalizeSearchText(query ?? "");
  const [rows, counts] = await Promise.all([
    db.select().from(themes).where(eq(themes.active, true)).orderBy(asc(themes.position)),
    loadThemePostCounts(),
  ]);
  return rows
    .filter((theme) => !clean || normalizeSearchText(theme.name).includes(clean) || normalizeSearchText(theme.tagline).includes(clean))
    .map((theme) => ({
      id: theme.id,
      slug: theme.slug,
      name: theme.name,
      category: theme.category as ThemeCategory,
      tagline: theme.tagline,
      position: theme.position,
      postCount: counts.get(theme.slug) ?? 0,
      tagCount: 0,
      relatedTags: [],
      active: theme.active,
    }));
}

export async function getThemeById(id: string): Promise<ThemeItem | null> {
  const db = getDatabase();
  const rows = await db.select().from(themes).where(and(eq(themes.id, id), eq(themes.active, true))).limit(1);
  const row = rows[0];
  if (!row) return null;
  const counts = await loadThemePostCounts();
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ThemeCategory,
    tagline: row.tagline,
    position: row.position,
    postCount: counts.get(row.slug) ?? 0,
    tagCount: 0,
    relatedTags: [],
    active: row.active,
  };
}

export async function getThemeBySlug(slug: string): Promise<ThemeItem | null> {
  const db = getDatabase();
  const rows = await db.select().from(themes).where(and(eq(themes.slug, slug), eq(themes.active, true))).limit(1);
  const row = rows[0];
  if (!row) return null;
  const counts = await loadThemePostCounts();
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ThemeCategory,
    tagline: row.tagline,
    position: row.position,
    postCount: counts.get(row.slug) ?? 0,
    tagCount: 0,
    relatedTags: [],
    active: row.active,
  };
}

/* ---------------------------------- Auteurs ----------------------------------- */

export async function listAuthors(query?: string): Promise<AuthorProfile[]> {
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

export async function getAuthorById(id: string): Promise<AuthorProfile | null> {
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

export async function getAuthorByUsername(username: string): Promise<AuthorProfile | null> {
  const target = normalizeSearchText(username);
  const db = getDatabase();
  const rows = await db
    .select(authorRowColumns)
    .from(authorProfiles)
    .innerJoin(users, eq(users.id, authorProfiles.userId))
    .where(and(sql`lower(${authorProfiles.usernameNormalized}) = ${target}`, eq(authorProfiles.status, "ACTIVE")))
    .limit(1);
  const row = (rows as unknown as AuthorRowFlat[])[0];
  if (!row) return null;
  return getAuthorById(row.userId);
}

/* ------------------------------- Suppression de compte ------------------------------ */

export async function deleteAccount(userId: string): Promise<void> {
  const db = getDatabase();
  // Posts → DELETED ; commentaires → DELETED ; profil auteur retiré ; utilisateur supprimé (cascade sessions, favoris, réactions…).
  await db.update(posts).set({ status: "DELETED" as const, updatedAt: new Date() }).where(eq(posts.authorId, userId));
  await db.update(comments).set({ status: "DELETED" as const, updatedAt: new Date() }).where(eq(comments.authorId, userId));
  await db.delete(authorProfiles).where(eq(authorProfiles.userId, userId));
  await db.delete(oauthAccounts).where(eq(oauthAccounts.userId, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(userFollows).where(eq(userFollows.followedId, userId));
  await db.delete(userFollows).where(eq(userFollows.followerId, userId));
  await db.delete(userBlocks).where(eq(userBlocks.blockedId, userId));
  await db.delete(userBlocks).where(eq(userBlocks.blockerId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
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
