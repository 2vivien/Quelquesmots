# Audit Cache HTTP & Performance — synthèse et actions (16/11/2026)

> Audit initialement fourni (relecture du code sur `main`, au commit `a716327`, qui introduit le Data Cache Next.js).
> Ce document conserve le raisonnement original, ce qui a été corrigé (avec les commits), ce qui a été gardé,
> ce qui a été reporté, et les preuves de vérification. Aucun élément personnalisé n'a été supprimé pour « gagner du temps ».

## 1. Le constat de l'audit

Les données sensibles au lecteur étaient servies avec `Cache-Control: public` :

| Route | Pourquoi la réponse dépend du lecteur |
|---|---|
| `/api/posts` | Applique les auteurs bloqués et peut inclure les textes privés du propriétaire |
| `/api/posts/by-id/[id]` | Droits du lecteur (propriétaire privé vs erreur 404) |
| `/api/posts/by-id` | La liste dépend de la session |

Un cache HTTP partagé ne devait pas pouvoir réutiliser ces réponses pour un autre lecteur (risque de fuite d'informations privées ou de mauvais feed).

## 2. Ce qui a été corrigé (commits sur `main`)

### 2.1. Cache HTTP personnalisé → `private, no-store` (commit `5f05e5b`)

Constante partagée dans `lib/server/http.ts` :

```ts
export const PRIVATE_NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
} as const;
```

Appliquée aux routes dépendant du lecteur (avant : `public, s-maxage=…` ou absent ; un cache partagé aurait pu les stocker/servir) :

- `app/api/posts/route.ts` (feed, avant `public, s-maxage=30, stale-while-revalidate=60`)
- `app/api/posts/by-id/route.ts` (avant `s-maxage=60`)
- `app/api/posts/by-id/[id]/route.ts` (avant `s-maxage=60`)
- `app/api/interactions/state/route.ts`
- `app/api/search/route.ts`
- `app/api/posts/[postId]/comments/route.ts` (GET)
- `app/api/notifications/route.ts`
- `app/api/auth/session/route.ts`

Les routes publiques du catalogue (thèmes, tags, auteurs) et les assets d'upload **gardent leur cache partagé** (`public, s-maxage=…, immutable`) : c'était recommandé, ça l'est resté.

⚠️ Le `no-store` HTTP ne désactive **pas** le cache interne du repository (`unstable_cache`) : les lectures SQL restent mises en cache.

### 2.2. Invalidation du cache catalogue (commit `ef06e6e`)

`lib/server/catalog-cache.ts` — `invalidateCatalog()` appelait `revalidatePublicCache()` **après** le contrôle Redis : sans Upstash configuré, le Data Cache Next.js n'était jamais invalidé.

Correctif (à la lettre du rapport) : `revalidatePublicCache()` **toujours** en premier, puis Redis en best-effort (`scan` + `del` sur le préfixe `qm:catalog:`, TTL de repli de 120 s). Ne règle pas la synchronisation Data Cache multi-instances (cf. §4), mais corrige le cas « Redis absent ».

### 2.3. Chemin de lecture serveur direct, sans appel HTTP interne (commit `2e44b47`)

Avant, les Server Components (`/`, `/themes`, `/auteurs`, `/tags/[tagId]`, `/mots/[id]`, `opengraph-image`…) appelaient `postsService` → `posts.real.ts` → `fetch(apiUrl("/api/…"))` : chaque rendu serveur faisait un **appel HTTP vers sa propre API**, avec perte de contexte (le cookie n'était pas transmis → un propriétaire n'était pas reconnu sur son texte privé via `/api/posts/by-id/[id]`).

Après :

- `lib/server/session.ts` : logique commune extraite → `resolveSessionUserIdFromToken()` (hachage SHA-256 du jeton, `sessions` table, jointure `users`, rafraîchissement best-effort de `lastUsedAt`). `getSessionUserId(req)` délègue à celle-ci — comportement des routes API inchangé.
- `lib/server/auth-server.ts` (nouveau, serveur uniquement) : `getServerSessionUser()` — cookie lu via `next/headers`, mémorisé par requête React (`cache`), renvoie `AuthUser | null`.
- Services serveur (mêmes données que les routes publiques correspondantes, **zéro fetch**) :
  - `features/posts/services/posts.server.ts` → `serverPostsService` (`listFeed`, `getById` avec `canViewPost` appliqué, `getByIds`, `listRelated`)
  - `features/themes/services/themes.server.ts` → `serverThemesService` (`listActive`, `getById`)
  - `features/authors/services/authors.server.ts` → `serverAuthorsService` (`listDirectory`, `getById`)
  - `features/tags/services/tags.server.ts` → `serverTagsService` (`listPopular`, `getById`)
- Pages converties : `/`, `/themes`, `/themes/[id]`, `/auteurs`, `/auteurs/[id]`, `/tags/[tagId]`, `/mots/[id]`, `/mots/[id]/opengraph-image`.

**Bug de sécurité corrigé au passage** : `/mots/[id]` n'avait **aucun** contrôle de visibilité — la protection reposait uniquement sur le détour HTTP (404). Désormais la page lit la session serveur et applique `canViewPost` : le propriétaire voit son texte privé ; les autres reçoivent `notFound()`. L'image OG applique le même gate (pas de fuite de titre/texte privé chez les crawlers ; carte générique pour un privé vu sans session).

### 2.4. Lecture des auteurs bloqués unique (commit `be0f20e`)

`/api/posts` utilisait `getInteractionState()` (5 lectures : likes, dislikes, bookmarks, follows, blocks) uniquement pour récupérer les blocages. Nouvelle `getBlockedUserIds()` dans `lib/server/repository.ts` — **1 seule lecture**. `getInteractionState()` reste inchangée pour l'endpoint `/api/interactions/state`.

## 3. Ce qui a été gardé (recommandation de l'audit)

- `unstable_cache` du repository et durées actuelles : **feed 30 s**, fiche texte 60 s, thèmes/tags/auteurs 120 s, recherche 30 s. Clé de cache correcte (`unstable_cache` intègre les arguments : `viewerId`, filtres, auteurs bloqués → les résultats ne sont pas mélangés entre lecteurs).
- `force-dynamic` sur toutes les pages DB-backed (pas de dépendance build/base au build).
- Personnalisation : les réactions personnelles ne sont **pas** dans le feed ; `likedByMe` des commentaires préservé côté serveur (`listComments`) ; l'état personnel des publications passe par `/api/interactions/state` (client, React Query), indépendant du feed.
- Cache `public` partagé sur le catalogue public (thèmes, tags, auteurs, uploads immutable).

## 4. Ce qui a été reporté — volontairement (à faire seulement si l'infra l'exige)

| Point | Raison |
|---|---|
| Migrer tout le cache vers Upstash | Coût/complexité non justifiés ; le Data Cache Next.js suffit ; Upstash reste pour tags catalogue + rate limiting |
| ISR sur les pages | Le couple rendue dynamique + `unstable_cache` donne déjà le bénéfice ; pas de prérendu dépendant d'une base |
| Multi-instances Railway | Si plusieurs instances : `cacheHandler` partagé (doc Next.js) ou extension explicite de Redis au feed/textes/thèmes/auteurs/recherche. Sur une seule instance : ne rien ajouter |
| Réécriture du SQL du feed | `posts_feed_idx` existe ; mesurer d'abord avec `EXPLAIN ANALYZE` (requête principale + 2 lectures `mapSummaries` = 3 requêtes par cache miss) |
| Supprimer les filtres utilisateur | JAMAIS pour un gain de millisecondes |
| Passer à `react/cache` côté client | Hors sujet |

**Au déploiement Vercel** : le passage annoncé du Data Cache vers le **Runtime Cache** (30/10/2026) doit être vérifié (conditions et facturation). Les constats ci-dessus concernent le comportement mesuré/constaté, pas de tests de charge sur l'infrastructure Railway/Vercel.

## 5. Vérifications (16/11/2026)

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | ✔ |
| `eslint` (app, lib, fichiers touchés) | ✔ |
| `bun run check` (conventions) | ✔ |
| `bun run build` (production) | ✔ — toutes les routes compilent, pages DB-backed `ƒ (Dynamic)` |
| e2e Playwright | **10/10 ✔** |

Détails du run e2e : serveur de production frais (build du jour) sur le port 3001 avec les URLs OAuth bouchonnées vers `mock-google` local ; `playwright.config.ts` pointé temporairement sur 3001 (port 3000 occupé par le serveur de l'utilisateur) puis **restauré non commité** ; port 3000 jamais modifié. Le test `auth.spec.ts` crée puis supprime un compte de test jetable sur la branche Neon (`e2e.test@example.com`). `journey.spec.ts` est en lecture seule.

Limites assumées : pas de suite de tests unitaires dans le repo (seule e2e) ; pas de mesure de charge ; le flux OAuth réel n'est pas couvert (bouchon local uniquement).

## 6. Fichiers clés

- `lib/server/http.ts` (`PRIVATE_NO_STORE`), `lib/server/catalog-cache.ts`, `lib/server/session.ts`, `lib/server/auth-server.ts`, `lib/server/repository.ts` (`getBlockedUserIds`)
- `features/posts/services/posts.server.ts`, `features/themes/services/themes.server.ts`, `features/authors/services/authors.server.ts`, `features/tags/services/tags.server.ts`
- Pages : `app/page.tsx`, `app/themes(/[id])/page.tsx`, `app/auteurs(/[id])/page.tsx`, `app/tags/[tagId]/page.tsx`, `app/mots/[id]/page.tsx`, `app/mots/[id]/opengraph-image.tsx`
- Routes API : `posts`, `posts/by-id`, `posts/by-id/[id]`, `posts/[postId]/comments`, `interactions/state`, `notifications`, `auth/session`, `search`
