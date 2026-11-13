# Quelques mots — Architecture technique (frontend + backend)

Monolithe modulaire Next.js. Pas de microservices. Un seul dépôt, un seul déploiement.

## 1. Stack retenue (vérifiée par recherche web, novembre 2026)

| Couche | Choix | Remarque vérifiée |
|---|---|---|
| Framework | **Next.js 16** (App Router, React 19.2) | Turbopack par défaut ; `middleware.ts` remplacé par **`proxy.ts`** (runtime Node.js) ; `params`, `searchParams`, `cookies()`, `headers()` sont **asynchrones** ; caching explicite avec `"use cache"` (Cache Components) ; `revalidateTag(tag, profil)` demande un 2e argument ; Node ≥ 20.9, TypeScript ≥ 5.1 |
| Langage | TypeScript strict | |
| UI | Tailwind CSS v4 + shadcn/ui (composants copiés, restylés avec les tokens du fichier 1) | |
| Auth | **Better Auth** + Google OAuth, adaptateur Drizzle | Handler `toNextJsHandler(auth)` sur `app/api/auth/[...all]/route.ts`. Better Auth reprend le projet Auth.js : choix cohérent pour un nouveau projet |
| Base | PostgreSQL sur **Neon** | Extensions `pg_trgm`, `unaccent` |
| ORM | **Drizzle** + drizzle-kit | |
| Validation | **Zod** (partagé client/serveur) | |
| Éditeur | **Tiptap** | Avec Next.js : `immediatelyRender: false` sur `useEditor` pour éviter les erreurs d'hydratation |
| Données client | TanStack Query (mises à jour optimistes : likes, favoris) + Zustand pour l'état d'interface | |
| Icônes / animations | Tabler Icons, Framer Motion | Conformes aux conventions du fichier 05 |
| Stockage fichiers | Cloudflare R2 ou compatible S3 (avatars seulement en MVP) | |
| Limitation de débit | Upstash Redis (`@upstash/ratelimit`) | Ou table Postgres en repli |
| E-mail | Resend (v1.1) | |
| Erreurs | Sentry | |
| Tests | Vitest, Playwright, axe | |
| Déploiement | Vercel + Neon, région Europe (la plus proche de Cotonou) | |

> Si une version ou une API change (Next.js, Better Auth, Tiptap évoluent vite), vérifier la documentation officielle avant d'implémenter : la règle est de toujours retenir la meilleure pratique à jour.

## 2. Arborescence du projet (par feature, conforme au fichier 05)

Les limites de taille (composant 50 lignes, page 120 lignes), le zéro `any`, la séparation hooks / services / stores / types et le pattern `USE_MOCK` sont détaillés dans `05-conventions-de-code.md` et s'appliquent à tout ce qui suit.

```
quelques-mots/
├─ package.json  next.config.ts  drizzle.config.ts  tsconfig.json  biome.json
├─ proxy.ts                         # ex-middleware : filtre /studio, /admin, /parametres...
├─ .env.example
├─ drizzle/                         # migrations SQL
├─ public/images/themes/            # amour.webp, deuil.webp, solitude.webp, vie.webp, espoir.webp, societe.webp
├─ scripts/ seed.ts  rebuild-counters.ts  check-conventions.ts
├─ e2e/                             # Playwright
└─ src/
   ├─ app/                          # routes seulement : pages <= 120 lignes
   │  ├─ globals.css  layout.tsx  not-found.tsx  error.tsx
   │  ├─ (public)/ layout.tsx
   │  │  ├─ page.tsx                        # Mur
   │  │  ├─ explorer/page.tsx  recherche/page.tsx
   │  │  ├─ themes/page.tsx  themes/[slug]/page.tsx  tags/[slug]/page.tsx
   │  │  ├─ mots/[slug]/page.tsx  mots/[slug]/opengraph-image.tsx
   │  │  ├─ auteurs/page.tsx  auteurs/[username]/page.tsx
   │  │  └─ a-propos  conditions  confidentialite  aide
   │  ├─ (auth)/ connexion/page.tsx  bienvenue/page.tsx
   │  ├─ (app)/ layout.tsx
   │  │  ├─ studio/page.tsx  studio/[id]/page.tsx  studio/brouillons/page.tsx
   │  │  └─ bibliotheque  notifications  parametres  (page.tsx)
   │  ├─ (admin)/admin/ layout.tsx  page.tsx  signalements  textes  utilisateurs  themes  tags  texte-du-jour  parametres  audit
   │  ├─ api/ auth/[...all]  search/suggest  posts  posts/[id]/view  upload/avatar  cron/*
   │  └─ sitemap.ts  robots.ts
   ├─ features/                     # une feature = un domaine, voir structure type ci-dessous
   │  ├─ auth/  onboarding/  feed/  reader/  posts/  studio/
   │  ├─ interactions/  comments/  tags/  themes/  authors/
   │  ├─ search/  explore/  library/  notifications/  settings/
   │  └─ moderation/  admin/
   ├─ components/
   │  ├─ ui/                        # shadcn restylé
   │  └─ layout/                    # header, header-mobile, footer, user-menu (<= 50 lignes chacun)
   ├─ db/ index.ts  schema/ {auth, profiles, posts, taxonomy, social, moderation, system, index}.ts
   ├─ lib/ auth.ts  auth-client.ts  session.ts  env.ts  ratelimit.ts  sanitize.ts  time.ts  format.ts  errors.ts
   ├─ messages/fr.json
   └─ types/                        # types globaux transverses
```

Structure type d'une feature, exemple `studio` :

```
features/studio/
├─ README.md                        # rôle, API publique, dépendances (court)
├─ index.ts                         # seuls exports utilisables par d'autres features
├─ components/                      # chacun <= 50 lignes
│  ├─ StudioScreen.tsx  TitleField.tsx  EditorSurface.tsx  EditorToolbar.tsx
│  ├─ CharCounter.tsx  TagPicker.tsx  TagChip.tsx  ThemePicker.tsx
│  ├─ VisibilitySelect.tsx  SaveIndicator.tsx  PublishDialog.tsx  PreviewPane.tsx
├─ hooks/  useAutosave.ts  useStudioDraft.ts  useTagSuggestions.ts  usePublish.ts
├─ services/  studio.service.ts  studio.real.ts  studio.mock.ts  studio.mock-data.ts
├─ stores/  studio.store.ts         # état d'interface (aperçu ouvert, dernier enregistrement)
├─ types/  studio.types.ts
├─ schemas/  draft.schema.ts  publish.schema.ts
└─ utils/  excerpt.ts  slug.ts
```

Contenu des autres features (même structure) :

| Feature | Composants principaux | Services |
|---|---|---|
| `feed` | PostCard, PostList, FeedChips, FeedSearch, PostMetrics, TagList | `listFeed`, filtres |
| `reader` | ReaderHero, ReaderHeader, ReaderBody, RelatedPosts | `getPostBySlug`, `getRelatedPosts` |
| `interactions` | LikeButton, BookmarkButton, ShareButton, ViewTracker | like, favori, partage, vue |
| `comments` | CommentList, CommentItem, CommentForm | CRUD commentaires, masquage |
| `themes` | ThemeTile, ThemeGrid, ThemeHero, ThemeTabs | thèmes, tags associés |
| `authors` | AuthorRow, AuthorList, AuthorHeader | annuaire, profil public |
| `search` | SearchBar, SearchTabs, SearchResultRow, SuggestList | recherche, suggestions |
| `explore` | ExploreHero, SuggestionChips, FeaturedPost, AuthorsToDiscover | suggestions, texte du jour |
| `library` | DraftRow, BookmarkRow, LibraryTabs | brouillons, favoris |
| `notifications` | NotificationRow, NotificationTabs, BellBadge | liste, lecture, regroupement |
| `settings` | ProfileForm, AvatarUploader, PublishAsRadio, DangerZone | profil, export, suppression |
| `auth` / `onboarding` | LoginCard, GoogleButton, UsernameField, TermsCheckbox | session, pseudonyme |
| `moderation` | ReportDialog, ReportReasonList | signalements, blocage |
| `admin` | ReportTable, ModerationPanel, ThemeEditor, TagMerger, SettingsForm | actions admin, audit |

Règles d'architecture :
- `app/` ne contient que des pages, layouts et handlers fins (page <= 120 lignes) qui composent les composants de features.
- Sens des dépendances : composants -> hooks -> services -> db. Aucun accès à la base depuis un composant ou un hook.
- Une feature n'importe une autre feature que par son `index.ts`.
- Les Server Actions vivent dans `features/*/services/*.actions.ts` ; elles valident avec Zod, vérifient session et rôle, puis appellent le service.
- Chaque requête vérifie la visibilité du texte (`features/posts/utils/visibility.ts`), jamais côté interface seulement.
- `USE_MOCK` : chaque service a une interface, une implémentation réelle et une implémentation mock (fichier 05 §4).

## 3. Variables d'environnement (`.env.example`)

```bash
DATABASE_URL=postgres://...@...neon.tech/quelquesmots?sslmode=require
BETTER_AUTH_SECRET=          # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
R2_ACCOUNT_ID= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_BUCKET=
VIEW_HASH_SALT=              # sel pour l'empreinte anonyme des vues
CRON_SECRET=
SENTRY_DSN=
```

URI de redirection Google à déclarer : `{BETTER_AUTH_URL}/api/auth/callback/google` (doit correspondre exactement).

## 4. Authentification

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
      onboarded: { type: "boolean", defaultValue: false, input: false },
    },
  },
  plugins: [nextCookies()],
});
```

```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

```ts
// src/lib/session.ts
import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/connexion");
  if (!s.user.onboarded) redirect("/bienvenue");
  return s.user;
}
export async function requireRole(roles: Array<"moderator" | "admin">) {
  const u = await requireUser();
  if (!roles.includes(u.role as "moderator" | "admin")) redirect("/");
  return u;
}
```

```ts
// proxy.ts (Next.js 16) — filtre léger, la vraie vérification est faite dans les pages/actions
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(req: NextRequest) {
  const hasSession = !!getSessionCookie(req);
  if (!hasSession) {
    const url = new URL("/connexion", req.url);
    url.searchParams.set("retour", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/studio/:path*", "/bibliotheque", "/notifications", "/parametres", "/admin/:path*"],
};
```

Principe : `proxy.ts` ne fait qu'un filtrage rapide sur le cookie ; toute page et toute action re-vérifie la session et le rôle via `requireUser()` / `requireRole()`. Ne jamais se fier au seul proxy.

Première connexion : après le callback Google, si `onboarded = false`, redirection vers `/bienvenue` (choix du pseudonyme, biographie, conditions) ; la validation crée la ligne `author_profile` et passe `onboarded` à `true`.

Les tables `user`, `session`, `account`, `verification` sont générées par la CLI Better Auth (`npx @better-auth/cli generate`) dans `db/schema/auth.ts`, puis migrées avec drizzle-kit.

## 5. Schéma de base de données (Drizzle)

```ts
// src/db/schema/profiles.ts
import { pgTable, text, timestamp, boolean, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const publishAs = pgEnum("publish_as", ["USERNAME", "REAL_NAME", "ANONYMOUS"]);

export const authorProfile = pgTable("author_profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  username: text("username").notNull(),            // affichage (casse conservée)
  usernameNorm: text("username_norm").notNull(),   // minuscule, unique
  firstName: text("first_name"),                    // privé
  lastName: text("last_name"),                      // privé
  bio: text("bio"),                                 // 160 max
  avatarUrl: text("avatar_url"),
  defaultPublishAs: publishAs("default_publish_as").notNull().default("USERNAME"),
  listedInDirectory: boolean("listed_in_directory").notNull().default(true),
  showJoinDate: boolean("show_join_date").notNull().default(true),
  trustScore: integer("trust_score").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | SUSPENDED | BANNED
  suspendedUntil: timestamp("suspended_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("author_username_norm_uq").on(t.usernameNorm)]);
```

```ts
// src/db/schema/posts.ts
import { pgTable, pgEnum, uuid, text, jsonb, integer, timestamp, boolean, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const postStatus = pgEnum("post_status", ["DRAFT","PUBLISHED","UNDER_REVIEW","HIDDEN","DELETED"]);
export const postVisibility = pgEnum("post_visibility", ["PUBLIC","MEMBERS","PRIVATE"]);

export const post = pgTable("post", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  slug: text("slug"),                                  // null tant que brouillon
  contentJson: jsonb("content_json"),                  // Tiptap
  contentText: text("content_text").notNull().default(""),
  excerpt: text("excerpt"),
  status: postStatus("status").notNull().default("DRAFT"),
  visibility: postVisibility("visibility").notNull().default("PUBLIC"),
  publishAs: text("publish_as").notNull().default("USERNAME"),
  commentsEnabled: boolean("comments_enabled").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  sensitive: boolean("sensitive").notNull().default(false),   // exclu des classements
  moderationLocked: boolean("moderation_locked").notNull().default(false), // masqué par un modérateur
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  // colonne de recherche plein texte : type tsvector, déclarée par un customType
  // (customType({ dataType: () => "tsvector" })) et générée en SQL dans la migration :
  //   ALTER TABLE post ADD COLUMN search tsvector GENERATED ALWAYS AS
  //     (to_tsvector('french', coalesce(title,'') || ' ' || content_text)) STORED;
  // Note : unaccent() n'est pas IMMUTABLE ; pour ignorer les accents dans l'index, créer une
  // configuration de recherche française basée sur le dictionnaire unaccent, ou une fonction
  // wrapper IMMUTABLE, puis l'utiliser ici et dans les requêtes.
}, (t) => [
  uniqueIndex("post_slug_uq").on(t.slug),
  index("post_feed_idx").on(t.status, t.visibility, t.publishedAt.desc()),
  index("post_author_idx").on(t.authorId, t.status),
]);
// + index GIN sur search et index trigram sur title, ajoutés en SQL dans la migration :
//   CREATE INDEX post_search_gin ON post USING gin (search);
//   CREATE INDEX post_title_trgm ON post USING gin (title gin_trgm_ops);
```

```ts
// src/db/schema/taxonomy.ts
export const theme = pgTable("theme", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),            // « Des mots pour aimer, aimer encore. »
  description: text("description"),
  imageUrl: text("image_url"),
  position: integer("position").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
});
export const tag = pgTable("tag", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | BLOCKED
  useCount: integer("use_count").notNull().default(0),
  themeId: uuid("theme_id").references(() => theme.id),  // thème d'attache facultatif
});
export const postTheme = pgTable("post_theme", {
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  themeId: uuid("theme_id").notNull().references(() => theme.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.postId, t.themeId] })]);
export const postTag = pgTable("post_tag", {
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tag.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.postId, t.tagId] })]);
```

```ts
// src/db/schema/social.ts
export const like = pgTable("like", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.postId] })]);

export const bookmark = pgTable("bookmark", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.postId] })]);

export const comment = pgTable("comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),                       // 1 niveau de réponse
  body: text("body").notNull(),                       // 2 à 500
  status: text("status").notNull().default("VISIBLE"), // VISIBLE | HIDDEN_BY_AUTHOR | HIDDEN_BY_MOD | DELETED
  createdAt: timestamp("created_at").notNull().defaultNow(),
  editedAt: timestamp("edited_at"),
}, (t) => [index("comment_post_idx").on(t.postId, t.createdAt)]);

export const postView = pgTable("post_view", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
  viewerKey: text("viewer_key").notNull(),            // userId ou empreinte salée
  day: text("day").notNull(),                         // AAAA-MM-JJ
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("view_once_per_day").on(t.postId, t.viewerKey, t.day)]);

export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),   // LIKE | COMMENT | REPLY | SHARE | MENTION | MODERATION
  actorId: text("actor_id"),
  postId: uuid("post_id"),
  commentId: uuid("comment_id"),
  groupKey: text("group_key"),    // regroupement sur 1 h
  count: integer("count").notNull().default(1),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("notif_user_idx").on(t.userId, t.readAt, t.createdAt.desc())]);

export const userBlock = pgTable("user_block", {
  blockerId: text("blocker_id").notNull(),
  blockedId: text("blocked_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]);
```

```ts
// src/db/schema/moderation.ts
export const report = pgTable("report", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: text("reporter_id").notNull(),
  targetType: text("target_type").notNull(),  // POST | COMMENT | USER
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  priority: integer("priority").notNull().default(0),  // 2 = danger pour la personne
  status: text("status").notNull().default("OPEN"),    // OPEN | IN_REVIEW | RESOLVED | DISMISSED
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("report_once").on(t.reporterId, t.targetType, t.targetId)]);

export const moderationAction = pgTable("moderation_action", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id"),
  moderatorId: text("moderator_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  action: text("action").notNull(),  // HIDE | RESTORE | DELETE | WARN | SUSPEND | BAN
  reason: text("reason").notNull(),
  appealStatus: text("appeal_status"),   // null | OPEN | UPHELD | REVERSED
  appealText: text("appeal_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

```ts
// src/db/schema/system.ts
export const featuredPost = pgTable("featured_post", {
  day: text("day").primaryKey(),       // AAAA-MM-JJ
  postId: uuid("post_id").notNull(),
  pickedBy: text("picked_by"),         // null = sélection automatique
});
export const siteSetting = pgTable("site_setting", {
  key: text("key").primaryKey(),       // max_chars, min_chars, max_tags, banned_words...
  value: jsonb("value").notNull(),
});
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

Migration initiale : `CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;` avant les tables.

`drizzle.config.ts` : dialecte `postgresql`, `schema: "./src/db/schema"`, `out: "./drizzle"`, `dbCredentials.url: process.env.DATABASE_URL`.

## 6. Backend : routes, actions et contrats

### 6.1. Server Actions (mutations)

| Action | Entrée (Zod) | Contrôles | Effets |
|---|---|---|---|
| `saveDraft` | `{ id?, title?, contentJson, tagSlugs[], themeIds[], visibility, publishAs }` | session, propriétaire, statut DRAFT ou texte à modifier | crée/met à jour, recalcule `contentText`, `excerpt` |
| `publishPost` | `{ id }` | session, règles §9.4, limite de débit, auto-modération, compte non suspendu | génère le slug, `PUBLISHED` ou `UNDER_REVIEW`, `published_at`, compteurs de thèmes et tags |
| `unpublishPost` / `deletePost` | `{ id }` | propriétaire | repasse en brouillon / suppression logique |
| `toggleLike` | `{ postId }` | session, texte visible, 60/min | insère ou supprime, `like_count` dans la transaction, notification |
| `toggleBookmark` | `{ postId }` | session | idem |
| `addComment` / `editComment` / `deleteComment` | `{ postId, parentId?, body }` | session, commentaires activés, blocage, 10/10 min, mention | notifications COMMENT/REPLY/MENTION |
| `hideComment` (auteur du texte) | `{ commentId }` | propriétaire du texte | statut `HIDDEN_BY_AUTHOR` |
| `createReport` | `{ targetType, targetId, reason, details? }` | session, unicité, 20/jour | `report`, priorité auto |
| `blockUser` / `unblockUser` | `{ userId }` | session | `user_block` |
| `markNotificationsRead` | `{ ids[] }` ou tout | session | `read_at` |
| `completeOnboarding` | `{ username, bio?, acceptTerms }` | session, unicité, format §7.4 | crée `author_profile`, `onboarded = true` |
| `updateProfile` | `{ firstName?, lastName?, username?, bio?, defaultPublishAs, ... }` | session | met à jour |
| `requestAccountDeletion` | `{}` | session, reconnexion récente | planifie à J+14 |
| Admin : `moderatePost`, `moderateComment`, `sanctionUser`, `resolveReport`, `upsertTheme`, `mergeTags`, `blockTag`, `setFeaturedPost`, `updateSetting` | selon cas | `requireRole` | écrit `moderation_action` et `audit_log` |

### 6.2. Route handlers

| Méthode et route | Rôle |
|---|---|
| `GET /api/posts?theme=&tag=&author=&sort=recent|top&cursor=` | Liste paginée par curseur (pour le défilement infini) |
| `POST /api/posts/[id]/view` | Compte une vue (empreinte salée, après 5 s, exclusions) |
| `GET /api/search/suggest?q=` | Suggestions mixtes (max 5) |
| `POST /api/upload/avatar` | URL signée R2 vers le stockage |
| `GET /api/cron/aggregate-views` | Agrège et applique les vues (protégé par `CRON_SECRET`) |
| `GET /api/cron/purge` | Purge des comptes à supprimer, anciens brouillons vides |
| `GET /api/cron/featured` | Choisit le texte du jour si non défini |
| `GET|POST /api/auth/*` | Better Auth |

### 6.3. Requêtes clés (exemples)

Mur (récents, visibilité selon l'utilisateur) :

```ts
// features/posts/services/posts.queries.ts
export async function listFeed({ cursor, themeSlug, tagSlug, viewerId }: FeedParams) {
  return db.select(/* colonnes de carte + pseudo selon publishAs */)
    .from(post)
    .innerJoin(authorProfile, eq(authorProfile.userId, post.authorId))
    .where(and(
      eq(post.status, "PUBLISHED"),
      viewerId ? inArray(post.visibility, ["PUBLIC","MEMBERS"]) : eq(post.visibility, "PUBLIC"),
      cursor ? lt(post.publishedAt, cursor.publishedAt) : undefined,
      /* + filtre thème/tag via EXISTS, + exclusion des auteurs bloqués */
    ))
    .orderBy(desc(post.publishedAt), desc(post.id))
    .limit(21);   // 20 + 1 pour savoir s'il y a une suite
}
```

Recherche : `to_tsquery('french', unaccent(:q))` sur `post.search`, complétée par `similarity(title, :q) > 0.3` et `similarity(username_norm, :q)` pour les auteurs ; thèmes et tags par `ILIKE`/trigram.

Affichage de l'auteur : si `publishAs = ANONYMOUS` → « Anonyme » sans lien ; `REAL_NAME` → `firstName lastName` ; sinon `username`. Cette logique vit dans une seule fonction `displayAuthor()` (`features/authors/utils/display-author.ts`) utilisée partout (API, pages, notifications, Open Graph).

### 6.4. Cache et revalidation

- Pages publiques : `"use cache"` avec `cacheTag("feed")`, `cacheTag("post:"+id)`, `cacheTag("theme:"+slug)`, durée par `cacheLife`.
- Après une mutation : `revalidateTag("post:"+id, "max")` (le 2e argument est obligatoire en Next.js 16) et `updateTag` quand la mise à jour doit être visible immédiatement pour l'auteur.
- Contenus dépendant de l'utilisateur (likes de l'utilisateur, favoris) : récupérés côté client via TanStack Query, ne sont jamais mis en cache partagé.

### 6.5. Erreurs et validation

- Erreurs typées (`AppError` avec `code` : `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `VALIDATION`, `LOCKED`). Les actions retournent `{ ok: true, data } | { ok: false, code, message, fieldErrors? }` en français.
- Les schémas Zod sont dans `features/*/schemas/` et partagés avec les formulaires.

## 7. Frontend : composition et état

- Pages publiques en composants serveur ; interactions (like, favori, éditeur, recherche, chips) en composants client isolés (`"use client"`), chacun <= 50 lignes.
- Mur : liste serveur pour la première page, puis `useInfiniteQuery` (hook `useInfiniteFeed`) sur `/api/posts`.
- Like / favori : `useMutation` optimiste avec retour arrière en cas d'erreur, dans les hooks `useLike` et `useBookmark`.
- État serveur : TanStack Query. État d'interface : Zustand (un store par feature, <= 80 lignes).
- Formulaires : React Hook Form + resolver Zod (schémas dans `schemas/`).
- Éditeur Tiptap : composant client chargé dynamiquement (`next/dynamic`, sans SSR), `immediatelyRender: false`, `CharacterCount` avec limite configurable, hook `useAutosave` (délai 1,5 s, copie locale hors ligne). Découpé en petits composants (surface, barre d'outils, compteur, sélecteurs).
- Visuel : tokens du fichier 01 ; `next/font` pour Newsreader et Inter ; `next/image` pour toutes les images.
- Toasts : sonner. Icônes : **Tabler Icons** (`@tabler/icons-react`). Animations : **Framer Motion**, limitées aux fondus et glissements courts, désactivées si `prefers-reduced-motion`.

## 8. Sécurité (implémentation)

- Toutes les Server Actions appellent `requireUser()` en première ligne ; les actions admin `requireRole()`.
- Contrôle d'accès au niveau requête (propriétaire, visibilité), jamais seulement dans l'interface.
- `sanitize.ts` : liste blanche des noeuds Tiptap ; tout le reste est rejeté.
- En-têtes dans `next.config.ts` : CSP stricte, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Limitation de débit centralisée dans `lib/ratelimit.ts` (clé = userId, sinon IP).
- Aucune IP brute en base : empreinte salée quotidienne pour les vues.
- Secrets uniquement dans les variables d'environnement, validés au démarrage par `lib/env.ts`.

## 9. Observabilité

Sentry (erreurs et traces), journal d'audit pour la modération et l'administration, logs structurés pour les actions sensibles, tableau de bord admin avec les indicateurs du cahier des charges §2.3.

## 10. Déploiement

1. Créer le projet Neon (région Europe), activer `pg_trgm` et `unaccent`, créer une branche par environnement (production, préproduction, tests).
2. Créer l'application OAuth Google, déclarer les URI de redirection (local, préproduction, production).
3. Déployer sur Vercel, renseigner les variables, définir les tâches planifiées (cron) pour `/api/cron/*`.
4. `drizzle-kit migrate` exécuté en phase de build ou de release, jamais manuellement en production.
5. `scripts/seed.ts` : 9 thèmes (Amour, Deuil, Solitude, Vie, Espoir, Santé émotionnelle, Amitié, Pensées, Société) avec accroches et images, tags de départ, paramètres par défaut, compte admin initial.
6. Domaine, HTTPS, redirections `www`, vérification Open Graph et sitemap.

## 11. Scripts `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts",
    "auth:generate": "npx @better-auth/cli generate",
    "test": "vitest run",
    "e2e": "playwright test"
  }
}
```

## 12. Correspondance écran → route → données → actions

| Écran | Route | Données lues | Actions |
|---|---|---|---|
| Mur | `/` | `listFeed`, thèmes actifs | like, favori, partage |
| Recherche | `/recherche` | `search` | — |
| Exploration | `/explorer` | suggestions, auteurs à découvrir, texte du jour | — |
| Thèmes | `/themes` | `theme` + `postCount` | — |
| Thème | `/themes/[slug]` | thème, tags associés, textes, auteurs | — |
| Lecture | `/mots/[slug]` | texte, commentaires, textes similaires | like, favori, commenter, signaler, partager, vue |
| Auteurs | `/auteurs` | `author_profile` listés | — |
| Profil public | `/auteurs/[username]` | profil, textes publics | signaler, bloquer |
| Studio | `/studio`, `/studio/[id]` | brouillon, tags suggérés | `saveDraft`, `publishPost` |
| Brouillons / Bibliothèque | `/studio/brouillons`, `/bibliotheque` | brouillons, favoris | supprimer, retirer |
| Notifications | `/notifications` | `notification` | marquer lu |
| Paramètres | `/parametres` | profil, préférences | `updateProfile`, export, suppression |
| Connexion | `/connexion`, `/bienvenue` | — | Google, `completeOnboarding` |
| Admin | `/admin/*` | signalements, textes, utilisateurs, réglages | actions admin |
