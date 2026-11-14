import type { TiptapDoc } from "../types";
import {
  AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestampColumn = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const userRoleEnum = pgEnum("user_role", ["user", "moderator", "admin"]);
export const accountStatusEnum = pgEnum("account_status", ["ACTIVE", "SUSPENDED", "BANNED"]);
export const publishAsEnum = pgEnum("publish_as", ["USERNAME", "REAL_NAME", "ANONYMOUS"]);
export const visibilityEnum = pgEnum("post_visibility", ["PUBLIC", "PRIVATE"]);
export const postStatusEnum = pgEnum("post_status", ["DRAFT", "PUBLISHED", "UNDER_REVIEW", "HIDDEN", "DELETED"]);
export const commentStatusEnum = pgEnum("comment_status", ["VISIBLE", "HIDDEN_BY_AUTHOR", "HIDDEN_BY_MOD", "DELETED"]);
export const reactionTypeEnum = pgEnum("reaction_type", ["LIKE", "DISLIKE"]);
export const tagStatusEnum = pgEnum("tag_status", ["PENDING", "APPROVED", "BLOCKED"]);
export const notificationTypeEnum = pgEnum("notification_type", ["LIKE", "COMMENT", "REPLY", "SHARE", "MENTION", "MODERATION"]);
export const reportTargetTypeEnum = pgEnum("report_target_type", ["POST", "COMMENT", "USER"]);
export const reportReasonEnum = pgEnum("report_reason", ["SPAM", "HARASSMENT", "HATE", "DANGER", "OTHER"]);
export const reportStatusEnum = pgEnum("report_status", ["OPEN", "RESOLVED", "DISMISSED"]);

/**
 * Compte privé de connexion. Les informations éditoriales publiques se trouvent
 * dans authorProfiles ; aucun e-mail n'est destiné aux réponses publiques.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 320 }),
  emailVerifiedAt: timestampColumn("email_verified_at"),
  role: userRoleEnum("role").notNull().default("user"),
  status: accountStatusEnum("status").notNull().default("ACTIVE"),
  onboarded: boolean("onboarded").notNull().default(false),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  deletedAt: timestampColumn("deleted_at"),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email).where(sql`${table.email} IS NOT NULL`),
  index("users_status_created_idx").on(table.status, table.createdAt),
]);

/** Identité publique/pseudonyme, distincte de l'adresse e-mail d'authentification. */
export const authorProfiles = pgTable("author_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 32 }).notNull(),
  usernameNormalized: varchar("username_normalized", { length: 32 }).notNull(),
  firstName: varchar("first_name", { length: 80 }).notNull().default(""),
  lastName: varchar("last_name", { length: 80 }).notNull().default(""),
  bio: varchar("bio", { length: 160 }).notNull().default(""),
  avatarUrl: varchar("avatar_url", { length: 512 }).notNull().default("/images/editorial/avatar-emma.jpg"),
  defaultPublishAs: publishAsEnum("default_publish_as").notNull().default("USERNAME"),
  listedInDirectory: boolean("listed_in_directory").notNull().default(true),
  showJoinDate: boolean("show_join_date").notNull().default(true),
  status: accountStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("author_profiles_username_normalized_unique").on(table.usernameNormalized),
  index("author_profiles_directory_idx").on(table.status, table.listedInDirectory, table.usernameNormalized),
]);

/** Liaison durable entre un fournisseur OAuth et un compte interne. */
export const oauthAccounts = pgTable("oauth_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 40 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  providerEmail: varchar("provider_email", { length: 320 }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("oauth_accounts_provider_account_unique").on(table.provider, table.providerAccountId),
  index("oauth_accounts_user_idx").on(table.userId),
]);

/** Session opaque : seul le hash du jeton remis dans le cookie sera stocké. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestampColumn("expires_at").notNull(),
  lastUsedAt: timestampColumn("last_used_at").notNull().defaultNow(),
  userAgent: varchar("user_agent", { length: 512 }),
  ipHash: varchar("ip_hash", { length: 64 }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
  index("sessions_user_expires_idx").on(table.userId, table.expiresAt),
  index("sessions_expires_idx").on(table.expiresAt),
]);

export const themes = pgTable("themes", {
  id: text("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tagline: varchar("tagline", { length: 240 }).notNull().default(""),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("themes_slug_unique").on(table.slug),
  index("themes_active_position_idx").on(table.active, table.position),
]);

export const tags = pgTable("tags", {
  slug: varchar("slug", { length: 32 }).primaryKey(),
  label: varchar("label", { length: 64 }).notNull(),
  status: tagStatusEnum("status").notNull().default("PENDING"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("tags_label_normalized_unique").on(sql`lower(${table.label})`),
  index("tags_status_created_idx").on(table.status, table.createdAt),
]);

/**
 * Texte ou brouillon. Les compteurs sont des caches transactionnels :
 * les tables de réactions/commentaires/favoris restent la source de vérité.
 */
export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  slug: varchar("slug", { length: 128 }),
  title: varchar("title", { length: 120 }).notNull().default("Sans titre"),
  excerpt: varchar("excerpt", { length: 280 }).notNull().default(""),
  contentJson: jsonb("content_json").$type<TiptapDoc>().notNull(),
  contentText: text("content_text").notNull().default(""),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  authorUsername: varchar("author_username", { length: 32 }).notNull(),
  authorFirstName: varchar("author_first_name", { length: 80 }),
  authorLastName: varchar("author_last_name", { length: 80 }),
  authorAvatarUrl: varchar("author_avatar_url", { length: 512 }).notNull().default(""),
  publishAs: publishAsEnum("publish_as").notNull().default("USERNAME"),
  visibility: visibilityEnum("visibility").notNull().default("PUBLIC"),
  status: postStatusEnum("status").notNull().default("DRAFT"),
  heroImageUrl: varchar("hero_image_url", { length: 512 }).notNull().default(""),
  commentsEnabled: boolean("comments_enabled").notNull().default(true),
  moderationLocked: boolean("moderation_locked").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  dislikeCount: integer("dislike_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  publishedAt: timestampColumn("published_at"),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("posts_slug_unique").on(table.slug).where(sql`${table.slug} IS NOT NULL`),
  index("posts_feed_idx").on(table.status, table.visibility, table.publishedAt, table.id),
  index("posts_author_status_updated_idx").on(table.authorId, table.status, table.updatedAt),
  index("posts_published_at_idx").on(table.publishedAt),
  check("posts_counters_non_negative", sql`${table.viewCount} >= 0 AND ${table.likeCount} >= 0 AND ${table.dislikeCount} >= 0 AND ${table.commentCount} >= 0 AND ${table.bookmarkCount} >= 0`),
]);

export const postThemes = pgTable("post_themes", {
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  themeId: text("theme_id").notNull().references(() => themes.id, { onDelete: "restrict" }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.themeId] }),
  index("post_themes_theme_post_idx").on(table.themeId, table.postId),
]);

export const postTags = pgTable("post_tags", {
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagSlug: varchar("tag_slug", { length: 32 }).notNull().references(() => tags.slug, { onDelete: "restrict" }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagSlug] }),
  index("post_tags_tag_post_idx").on(table.tagSlug, table.postId),
]);

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  authorUsername: varchar("author_username", { length: 32 }).notNull(),
  authorAvatarUrl: varchar("author_avatar_url", { length: 512 }).notNull().default(""),
  parentId: text("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
  body: varchar("body", { length: 500 }).notNull(),
  status: commentStatusEnum("status").notNull().default("VISIBLE"),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  index("comments_post_status_created_idx").on(table.postId, table.status, table.createdAt),
  index("comments_parent_idx").on(table.parentId),
  index("comments_author_created_idx").on(table.authorId, table.createdAt),
]);

/** Une seule réaction par utilisateur et publication ; LIKE/DISLIKE sont exclusifs. */
export const postReactions = pgTable("post_reactions", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  reaction: reactionTypeEnum("reaction").notNull(),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.postId] }),
  index("post_reactions_post_type_idx").on(table.postId, table.reaction),
  index("post_reactions_user_created_idx").on(table.userId, table.createdAt),
]);

export const postBookmarks = pgTable("post_bookmarks", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.postId] }),
  index("post_bookmarks_post_idx").on(table.postId),
]);

export const commentLikes = pgTable("comment_likes", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  commentId: text("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.commentId] }),
  index("comment_likes_comment_idx").on(table.commentId),
]);

export const userFollows = pgTable("user_follows", {
  followerId: text("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followedId: text("followed_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followedId] }),
  index("user_follows_followed_idx").on(table.followedId, table.createdAt),
  check("user_follows_no_self", sql`${table.followerId} <> ${table.followedId}`),
]);

export const userBlocks = pgTable("user_blocks", {
  blockerId: text("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: text("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.blockerId, table.blockedId] }),
  check("user_blocks_no_self", sql`${table.blockerId} <> ${table.blockedId}`),
]);

/** Une ligne par couple publication/lecteur pour la déduplication de 90 secondes. */
export const postViewDedupe = pgTable("post_view_dedupe", {
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  viewerHash: varchar("viewer_hash", { length: 64 }).notNull(),
  lastViewedAt: timestampColumn("last_viewed_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.viewerHash] }),
  index("post_view_dedupe_last_viewed_idx").on(table.lastViewedAt),
]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  type: notificationTypeEnum("type").notNull(),
  actorUsername: varchar("actor_username", { length: 32 }).notNull(),
  actorAvatarUrl: varchar("actor_avatar_url", { length: 512 }).notNull().default(""),
  postId: text("post_id").references(() => posts.id, { onDelete: "set null" }),
  postTitle: varchar("post_title", { length: 120 }).notNull().default(""),
  postSlug: varchar("post_slug", { length: 128 }).notNull().default(""),
  readAt: timestampColumn("read_at"),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  index("notifications_user_created_idx").on(table.userId, table.createdAt),
  index("notifications_user_unread_idx").on(table.userId, table.readAt).where(sql`${table.readAt} IS NULL`),
]);

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
  targetType: reportTargetTypeEnum("target_type").notNull(),
  targetId: text("target_id").notNull(),
  targetLabel: varchar("target_label", { length: 200 }).notNull(),
  reason: reportReasonEnum("reason").notNull(),
  details: varchar("details", { length: 1000 }).notNull().default(""),
  priority: integer("priority").notNull().default(0),
  status: reportStatusEnum("status").notNull().default("OPEN"),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
  reviewedAt: timestampColumn("reviewed_at"),
}, (table) => [
  uniqueIndex("reports_reporter_target_unique").on(table.reporterId, table.targetType, table.targetId),
  index("reports_queue_idx").on(table.status, table.priority, table.createdAt),
  index("reports_target_idx").on(table.targetType, table.targetId),
]);

export const adminAudit = pgTable("admin_audit", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorUsername: varchar("actor_username", { length: 32 }).notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  targetType: varchar("target_type", { length: 32 }),
  targetId: text("target_id"),
  targetLabel: varchar("target_label", { length: 200 }).notNull(),
  reason: varchar("reason", { length: 500 }).notNull().default(""),
  createdAt: timestampColumn("created_at").notNull().defaultNow(),
}, (table) => [
  index("admin_audit_created_idx").on(table.createdAt),
  index("admin_audit_actor_created_idx").on(table.actorId, table.createdAt),
]);

/** Configuration globale : une seule ligne, id = 1. */
export const siteSettings = pgTable("site_settings", {
  id: smallint("id").primaryKey().default(1),
  maxChars: integer("max_chars").notNull().default(50000),
  minChars: integer("min_chars").notNull().default(20),
  maxTags: integer("max_tags").notNull().default(5),
  dailyPublishLimit: integer("daily_publish_limit").notNull().default(10),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
}, (table) => [
  check("site_settings_singleton", sql`${table.id} = 1`),
  check("site_settings_valid_limits", sql`${table.minChars} >= 1 AND ${table.maxChars} >= ${table.minChars} AND ${table.maxTags} >= 1 AND ${table.dailyPublishLimit} >= 1`),
]);
