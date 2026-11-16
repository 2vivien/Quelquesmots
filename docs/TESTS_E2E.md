# Tests e2e — couverture complète et résultats (16/11/2026)

> Suite Playwright de bout en bout contre la base Neon de la branche de l'app.
> `playwright.config.ts` (repo) : serveur de production sur **3000** + mock-google sur **3999**.
> Pendant la phase de développement, le port **3000 est occupé par `next dev` du projet Quota** (un autre repo)
> — les tests du run de validation ont donc été exécutés via une config jetable sur **3001**
> (le repo, lui, n'a pas été modifié ; le serveur Quota n'a pas été touché).
> Pour relancer chez vous : `bun run test:e2e` (port 3000 libre) ou `E2E_BASE_URL=http://127.0.0.1:3001 bunx playwright test` avec un serveur sur 3001.

## Résultats — 22/22 ✔ (4.3 min, sans flaky)

| # | Spec / test | Ce qu'il prouve |
|---|---|---|
| 1 | `auth.spec.ts` — OAuth Google → session → déconnexion | Flux complet via bouchon local (aucun compte Google réel) |
| 2 | `journey.spec.ts` — accueil + fil | SSR + feed serveur direct (`posts.server`), au moins un texte publié |
| 3 | `journey.spec.ts` — page d'un texte | Navigation vers `/mots/[id]`, contenu rendu |
| 4 | `journey.spec.ts` — recherche FTS | Recherche dans l'UI + `/api/search` renvoie des résultats otés (`posts_fts_fr`) |
| 5 | `journey.spec.ts` — 55 thèmes | Catalogue exposé, `/themes/[id]` rendu (assertion sur le nom du thème, pas juste `main`) |
| 6 | `journey.spec.ts` — page tag | `/tags/[tagId]` OK, titre `#tag` rendu (assertion réelle) |
| 7 | `journey.spec.ts` — sitemap | URLs `/mots/` et `/themes/` présentes |
| 8 | `journey.spec.ts` — API feed | `/api/posts` renvoie `items` + `nextCursor` |
| 9 | `studio.spec.ts` — publier → accueil | Brouillon → publication → texte visible en SSR (chemin sans HTTP interne) |
| 10 | `studio.spec.ts` — texte privé | Invité : « Texte introuvable » (pas de donnée privée) ; auteur : contenu visible |
| 11 | `studio.spec.ts` — pas de thème | Publication refusée 400 (au moins 1 thème) |
| 12 | `studio.spec.ts` — texte trop court | Publication refusée 400 (`minChars`) |
| 13 | `studio.spec.ts` — suppression brouillon | DELETE → n'apparaît plus dans la liste (transaction) |
| 14 | `users.spec.ts` — inscription → onboarding | Session `plume-xxxxxxxx`, `onboarded` false → true, pseudonyme clair |
| 15 | `users.spec.ts` — annuaire | Après `listedInDirectory`, l'auteur apparaît dans `/api/authors` |
| 16 | `users.spec.ts` — pseudonyme déjà pris | 400 à la duplication |
| 17 | `users.spec.ts` — invité non connecté | 401 sur création de brouillon |
| 18 | `interactions.spec.ts` — like/dislike/bookmark | Transactions : like → unlike ; like→dislike (swap) ; favori + `bookmarkedIds` |
| 19 | `interactions.spec.ts` — commentaires + notifications | Commentaire → notif `COMMENT` pour l'auteur ; réponse → notif `REPLY` ; masquage décrémente le compteur transactionnellement |
| 20 | `interactions.spec.ts` — notifications LIKE | L'auteur reçoit `LIKE` quand un lecteur aime |
| 21 | `interactions.spec.ts` — vues | `/api/posts/[postId]/view` : dédoublonnage 90 s (premier `counted: true`, second `false`) |
| 22 | `admin.spec.ts` — signalement → masquage admin | 201 sur report, 403 pour non-admin, promotion via DB (`role=admin`), `HIDDEN` → 404 invité, entrée dans `/api/admin/audit` |

## Architecture des tests

- **Mock Google** (`scripts/mock-google.ts`) : `/token` + `/userinfo` sur `127.0.0.1:3999`. Deux modes :
  - code `mock-e2e-code` → profil historique fixe (`e2e.test@example.com`, compatible `auth.spec.ts`) ;
  - code `mock-e2e-<tag>` → profil déterministe `e2e-<tag>@example.com` / `mock-sub-<tag>` → **plusieurs utilisateurs distincts** dans la base de test.
- **Helpers** (`e2e/helpers.ts`) : `signInMockUser()` (flux OAuth complet + extraction `qm_session`),
  `signInGoogleWithRetry()` (retry 429 sur le limiter `signin:<ip>` 10/min, partagé par tout le worker),
  `createPublishedPost()` (brouillon + publication), `cleanupE2eTestData()` (suppression des e2e en cascade :
  posts puis utilisateurs ; `author_id` passerait sinon `NULL` en snapshot et laisserait des textes orphelins).
- **Nettoyage** : chaque fichier qui crée des comptes appelle `cleanupE2eTestData()` dans `afterAll`.
  Le pool Neon est partagé entre les specs du worker — ne jamais appeler `pool.end()` dans un spec.
- **Contextes frais** : les requêtes « invité » utilisent un `newContext` (sans cookie) via `testInfo.project.use.baseURL`
  (le `request` fixture d'un test conserve le cookie de session sign-in !).

## Bugs réels découverts et corrigés pendant la campagne

1. **`invalidateCatalog()` sans Redis** : le Data Cache Next.js n'était jamais invalidé. Corrigé (commit `ef06e6e`).
2. **Mutations sans invalidation** : likes, dislikes, commentaires, favoris, blocages, abonnements, `toggleCommentLike`,
   `hideComment` — les compteurs lus via l'API restaient périmés jusqu'à 60 s. Ajout de `invalidateCatalog()` (commit `290f21d`).
3. **`string_to_uuid` en base** : ids invalides atteignaient PostgreSQL depuis les pages SSR (500 + bruit).
   `getPostById` / `getPostsByIds` / `getThemeById` / `getTagById` / `getAuthorById` renvoient désormais `null`/`[]` (404) pour un id non-uuid.
4. **Page introuvable indexable** (soft-404) : `generateMetadata` du post rend désormais `robots: noindex`.
5. **Assertions faibles** : `main, article` est toujours présent (`AppChrome`) → les tests thème/tag sont renforcés sur le contenu réel.
6. **`signin:<ip>` 10/min** : toute la suite partage 127.0.0.1 → retry avec attente dans les helpers.

## Limites connues

- **Pas de suite de tests unitaires** (seule e2e) : la logique métier critique (`canViewPost`, `popularityScore`, tx) n'est pas testée en isolation.
- Tests e2e = **lecture/écriture sur la branche Neon de l'app** (créer un compte de test y crée des données ; elles sont nettoyées en cascade en fin de run).
- Flux OAuth réel non couvert (bouchon uniquement).
- Le build `next build` échoue parfois avec l'invariant `no direct app page entry found for /_not-found`
  (Next 15.5.29, transitoire) : il suffit de relancer `bun run build`.
- `bun run test:e2e` nécessite le **port 3000 libre** (sinon le serveur de prod échoue à démarrer ;
  `reuseExistingServer: true` ne contourne pas un port réellement pris).
