# Plan de migration PostgreSQL / Neon — Quelquesmots

**Date :** 14 novembre 2026  
**Statut :** cadrage et fondation technique ; aucun parcours métier n'est encore persistant.

**Artefacts de fondation versionnés :** `db/migrations/0000_initial_schema.sql`, `db/migrations/meta/0000_snapshot.json`, `db/migrations/meta/_journal.json` et `bun.lock`. La migration initiale décrit 20 tables, 29 clés étrangères, 35 index et les contraintes/enums définis ci-dessous. Elle a été générée par Drizzle Kit en mode schema-only ; elle n'a pas été appliquée à une base.

## 1. État du dépôt et décision d'architecture

### État Git revalidé

- La branche principale main était sur le commit c655755810106567f2ccd19f2ff624a68d317467.
- La PR #1, https://github.com/2vivien/Quelquesmots/pull/1, était ouverte, en brouillon et non fusionnée.
- La branche fix/persistence-and-backend-audit était 69 commits devant main et 0 commit derrière.
- La présente branche feat/postgres-drizzle-foundation est créée depuis fix/persistence-and-backend-audit. C'est une PR empilée qui dépend de la PR #1.
- Aucune écriture n'a été faite sur main, aucune PR n'a été fusionnée et aucune base n'a été contactée.

### Diagnostic réel

Le backend courant reste un store mémoire dans lib/server/store.ts. Il utilise globalThis.__qmStore, des tableaux et des Map pour les utilisateurs, profils, publications, brouillons, thèmes, tags, commentaires, réactions, favoris, suivis, blocages, vues, notifications, signalements, paramètres et traces d'audit.

Le mapping du sujet Google vers le compte interne est également une Map dans le callback OAuth. Le rate limiting est local au processus. Les adaptateurs frontend dits real appellent les routes API, mais plusieurs routes délèguent encore au store mémoire. Le fait d'avoir des routes HTTP ne signifie donc pas que les données sont enregistrées durablement.

Les seeds d'auteurs, de publications, de commentaires, de notifications et de signalements sont des données de démonstration. Les désactiver en production évite d'afficher de faux contenus, mais ne crée aucune persistance.

La conséquence est importante : un redémarrage, une autre instance serverless ou un autre processus ne partage pas nécessairement les écritures. Le store n'est pas un export durable ni une source fiable pour migrer des données réelles.

### Authentification actuelle

Le dépôt utilise un flux OAuth Google personnalisé :
- démarrage : app/api/auth/signin/google/route.ts ;
- callback : app/api/auth/callback/google/route.ts ;
- association Google sub vers utilisateur : Map mémoire ;
- session : cookie qm_session signé HMAC dans lib/server/session.ts ;
- résolution du compte : lib/server/auth.ts via le store mémoire.

Better Auth et NextAuth/Auth.js ne sont pas les mécanismes réellement utilisés par ces routes. L'ajout des tables oauth_accounts et sessions ne suffira donc pas à déclarer l'authentification migrée.

### Choix retenus

- PostgreSQL managé par Neon.
- Drizzle ORM et Drizzle Kit, pas Prisma.
- Driver Neon serverless avec Pool WebSocket pour les transactions multi-instructions.
- Zod conservé pour valider les entrées.
- Monolithe modulaire Next.js conservé.
- S3 compatible pour les fichiers ; PostgreSQL ne stocke que les références.
- Rate limiting partagé à introduire dans une phase distincte.

Le client db/index.ts est paresseux et n'est pas importé par les routes métier. Il ne réalise aucune connexion au moment de l'import.

## 2. Architecture cible

Flux cible :

Route Handler ou Server Action
→ Controller, validation Zod et authentification
→ Service métier et transaction
→ Repository Drizzle
→ PostgreSQL / Neon

Règles :
1. Les composants React n'importent jamais Drizzle.
2. Les routes ne construisent pas de requêtes SQL.
3. Les services portent les règles métier, permissions et transactions.
4. Les repositories encapsulent les lectures, écritures et projections.
5. Les pages SSR appellent les services serveur directement au lieu de faire un fetch HTTP vers leur propre domaine.
6. Les contrats JSON des endpoints restent stables autant que possible.
7. Les opérations qui modifient plusieurs tables ou un compteur sont transactionnelles.
8. Pas de microservices pour cette étape.

### Connexions

Deux variables sont distinguées :
- DATABASE_URL : endpoint Neon poolé pour le runtime.
- DATABASE_MIGRATION_URL : endpoint direct, non poolé, recommandé pour Drizzle Kit.

Le code applicatif ne doit pas importer drizzle.config.ts. Les migrations sont une opération de livraison explicite, jamais un effet de bord du démarrage Next.js.

Le driver WebSocket/Pool est retenu pour les réactions, publications et modérations qui nécessitent plusieurs instructions atomiques. Le driver HTTP simple est mieux adapté aux opérations isolées, mais ne doit pas être la base des workflows multi-instructions.

## 3. Modèle relationnel cible

Les tables ci-dessous correspondent au schéma Drizzle initial ajouté dans db/schema.ts. Les contrats TypeScript des fonctionnalités restent dans features/*/types.

### Comptes, profils et sessions

| Table | Données principales | Contraintes et relations |
|---|---|---|
| users | id, email, email_verified_at, role, status, onboarded, dates, deleted_at | email unique lorsqu'il est renseigné ; rôle et statut en enums |
| author_profiles | user_id, username normalisé, prénom, nom, bio, avatar_url, préférences de publication, paramètres annuaire | 1–1 users ; pseudonyme normalisé unique |
| oauth_accounts | id, user_id, provider, provider_account_id, provider_email | unique(provider, provider_account_id) |
| sessions | id, user_id, token_hash, expires_at, last_used_at, user_agent, ip_hash | hash de session unique ; index utilisateur/expiration |

L'e-mail et les identifiants fournisseur restent privés. Le pseudonyme public est distinct de l'identité d'authentification.

Pour Google, enregistrer le sub stable dans provider_account_id, pas le nom ou l'adresse e-mail comme identifiant primaire. Ne stocker aucun access token ou refresh token si le produit n'en a pas besoin. Ne pas fusionner automatiquement deux comptes sur la seule égalité d'un e-mail non vérifié.

Au cutover, les sessions HMAC actuelles ne correspondent à aucune session persistée. Une reconnexion Google contrôlée sera nécessaire. La cible recommandée est un jeton opaque aléatoire dans le cookie et uniquement son hash dans sessions.token_hash. La révocation consiste à supprimer la ligne ; les sessions expirées sont nettoyées périodiquement.

La décision entre conserver le flux OAuth personnalisé avec stockage DB et adopter Better Auth doit être prise avant la phase d'authentification. Cette fondation ne choisit pas silencieusement un nouveau système.

### Publications, thèmes et tags

| Table | Données principales | Contraintes et relations |
|---|---|---|
| posts | id, slug, titre, extrait, JSON Tiptap, texte simple, auteur, snapshots d'auteur, publication, visibilité, statut, compteurs, dates | FK auteur nullable ; slug unique lorsqu'il existe |
| themes | id, slug, nom, catégorie, tagline, position, active | slug unique |
| tags | slug, label, statut, created_by | slug clé primaire ; libellé normalisé |
| post_themes | post_id, theme_id | clé primaire composite ; suppression du post en cascade ; thème protégé |
| post_tags | post_id, tag_slug | clé primaire composite ; suppression du post en cascade ; tag protégé |

Statuts de publication : DRAFT, PUBLISHED, UNDER_REVIEW, HIDDEN, DELETED. Visibilité : PUBLIC ou PRIVATE.

Règles de lecture à préserver :
- Un texte DELETED ou HIDDEN n'est jamais public.
- Un brouillon ou texte en attente n'est visible que par le propriétaire ou un rôle autorisé.
- Un texte privé publié est visible seulement par son propriétaire et les accès administratifs explicitement autorisés.
- Les contrôles sont exécutés côté service/repository, jamais uniquement dans l'interface.

Les champs auteur copiés dans posts sont des snapshots éditoriaux : ils préservent l'attribution historique si le profil change ou si un compte est anonymisé. Les compteurs de posts par auteur, thème ou tag sont calculés. Les compteurs like/dislike/commentaire/favori/vue sur posts sont des caches transactionnels ; les tables relationnelles restent la source de vérité.

### Commentaires

| Table | Données principales | Relations |
|---|---|---|
| comments | id, post_id, author_id, snapshot auteur, parent_id, body, status, dates | FK publication, auteur nullable, parent auto-référencé |
| comment_likes | user_id, comment_id, created_at | clé primaire composite |

Statuts : VISIBLE, HIDDEN_BY_AUTHOR, HIDDEN_BY_MOD, DELETED.

Une réponse doit appartenir à la même publication que son parent. La FK parent_id seule ne suffit pas : le service doit valider cette règle. La politique de suppression physique des commentaires racines et réponses doit être arbitrée ; une suppression logique est préférable pour préserver la modération.

### Interactions et découverte

| Table | Données principales | Contrainte |
|---|---|---|
| post_reactions | user_id, post_id, reaction, dates | clé primaire (user_id, post_id), LIKE/DISLIKE exclusifs |
| post_bookmarks | user_id, post_id, created_at | clé primaire (user_id, post_id) |
| user_follows | follower_id, followed_id, created_at | clé primaire composite ; pas d'auto-abonnement |
| user_blocks | blocker_id, blocked_id, created_at | clé primaire composite ; pas d'auto-blocage |
| post_view_dedupe | post_id, viewer_hash, last_viewed_at | clé primaire composite |

Likes et dislikes sont une seule ligne par utilisateur/publication. Les favoris restent privés. Les abonnements et blocages restent séparés ; l'état de blocage doit être appliqué au flux et aux accès selon les règles métier.

Pour les vues, utiliser une empreinte HMAC/opaque de lecteur, jamais l'adresse IP en clair. Conserver la fenêtre actuelle de 90 secondes anti-doublon, puis purger les anciennes lignes. La durée de rétention doit être validée dans la politique de confidentialité.

### Notifications, modération et administration

| Table | Données principales | Relations |
|---|---|---|
| notifications | id, user_id, actor_id, type, snapshot actor, post_id nullable, snapshot post, read_at, created_at | propriétaire obligatoire ; acteur et post peuvent être anonymisés |
| reports | id, reporter_id, target_type/id, target_label, reason, details, priority, status, dates | cible polymorphe validée par service |
| admin_audit | id, actor_id, snapshot actor, action, target type/id/label, reason, created_at | journal append-only ; acteur nullable |
| site_settings | id=1, max_chars, min_chars, max_tags, daily_publish_limit, updated_by, updated_at | singleton contrôlé par CHECK |

Les cibles de signalement peuvent être POST, COMMENT ou USER. Il n'y a pas de FK simple vers trois tables : le service doit valider l'existence de la cible. La contrainte unique reporter/type/cible évite les doublons par déclarant. Les signalements anonymisés nécessitent une décision explicite car NULL ne se comporte pas comme une valeur dans un index unique.

L'audit n'est pas modifiable par les utilisateurs et ne doit pas contenir inutilement des informations privées.

## 4. Enums, contraintes et suppressions

Enums déclarés :
- user_role : user, moderator, admin ;
- account_status : ACTIVE, SUSPENDED, BANNED ;
- publish_as : USERNAME, REAL_NAME, ANONYMOUS ;
- post_visibility : PUBLIC, PRIVATE ;
- post_status : DRAFT, PUBLISHED, UNDER_REVIEW, HIDDEN, DELETED ;
- comment_status : VISIBLE, HIDDEN_BY_AUTHOR, HIDDEN_BY_MOD, DELETED ;
- reaction_type : LIKE, DISLIKE ;
- tag_status : PENDING, APPROVED, BLOCKED ;
- notification_type : LIKE, COMMENT, REPLY, SHARE, MENTION, MODERATION ;
- report_target_type : POST, COMMENT, USER ;
- report_reason : SPAM, HARASSMENT, HATE, DANGER, OTHER ;
- report_status : OPEN, RESOLVED, DISMISSED.

Politique proposée :
- Suppression utilisateur : procédure métier transactionnelle ; supprimer sessions/OAuth, anonymiser snapshots selon politique légale, nettoyer interactions privées, retirer le profil, conserver les traces d'audit anonymisées.
- Publication : statut DELETED et conservation des métadonnées nécessaires aux signalements/droits.
- Thème/tag encore utilisé : RESTRICT ; désassociation explicite après décision éditoriale.
- Brouillon : purge possible sous réserve de la politique de conservation.
- Suppression d'auteur : FK nullable avec SET NULL, snapshots éditoriaux conservés.
- Cascades réservées aux dépendances privées : sessions, OAuth, likes, favoris, abonnements/blocages ; réactions/commentaires publics ne sont physiquement purgés qu'après décision de conservation.

## 5. Index et requêtes

Index du schéma initial :
- flux public : status, visibility, published_at, id ;
- brouillons et textes auteur : author_id, status, updated_at ;
- slug publication unique ;
- comptes par statut/date ;
- pseudonyme normalisé unique et annuaire ;
- OAuth par fournisseur/subject unique ;
- sessions par hash unique, user/expiry et expiration ;
- thèmes actifs par position ;
- tags par statut/date ;
- jointures post/themes et post/tags dans les deux sens ;
- commentaires par post/status/date, parent et auteur ;
- réactions par post/type et user/date ;
- notifications par user/date et user/read_at ;
- signalements par statut/priorité/date ;
- audit par date et acteur/date ;
- nettoyage des vues dédupliquées par last_viewed_at.

À ajouter après mesure :
- index full-text français sur titre, extrait et contenu ;
- pg_trgm pour suggestions approximatives si le volume le justifie ;
- cache/classement populaire si le calcul SQL ne suffit plus.

Les requêtes seront validées par EXPLAIN (ANALYZE, BUFFERS) sur un volume réaliste. Les index partiels et expressions doivent être livrés par migrations relues.

## 6. Transactions métier

### Toggle LIKE / DISLIKE
1. verrouiller la publication avec SELECT FOR UPDATE pour sérialiser les actions sur un texte ;
2. lire la réaction actuelle ;
3. supprimer si identique ou insérer/remplacer si différente ;
4. appliquer les deltas des compteurs ;
5. ajouter la notification si nécessaire ;
6. commit.

Les clés primaires composites évitent les doublons. La réaction et les compteurs ne doivent jamais être écrits séparément.

### Favoris
Utiliser une insertion/suppression atomique, déterminer si la ligne a changé, mettre à jour bookmark_count dans la même transaction.

### Commentaires
Dans une transaction : vérifier statut/visibilité/commentaires activés, valider le parent, insérer le commentaire, incrémenter le compteur, créer la notification. Masquer un commentaire ne décrémente le compteur qu'une seule fois lors d'une transition de visible vers non visible.

### Publication et quota quotidien
Verrouiller l'utilisateur ou un quota par utilisateur/jour pour empêcher les publications concurrentes de dépasser la limite. Vérifier le propriétaire du brouillon et le verrouillage éditorial. Calculer le quota sur les publications réellement faites dans la journée. Mettre à jour le statut, slug unique, published_at, quota et audit éventuel dans une transaction. Le fuseau de calcul du quota reste à décider ; UTC est recommandé pour le stockage.

### Modération
Masquer/restaurer, changer le signalement et écrire l'entrée d'audit dans la même transaction. Si l'audit échoue, l'opération de modération échoue aussi.

### Suppression de compte
Anonymiser/supprimer les entités dépendantes et révoquer sessions/OAuth dans une transaction ou un workflow idempotent. Un cookie ancien ne doit jamais permettre de recréer une session.

## 7. Pagination, recherche et performances

Le curseur actuel fondé uniquement sur l'identifiant ne garantit pas un ordre chronologique stable. Faire évoluer le curseur opaque vers le couple (published_at, id), avec id comme tie-breaker. Conserver si possible le contrat JSON items/nextCursor ; seul le contenu opaque du curseur évolue. Le tri populaire aura un curseur distinct ou une fenêtre bornée, car les scores changent.

La recherche initiale doit être exécutée en SQL et filtrée par visibilité. Ne pas charger les tables entières pour faire un fuzzy match JavaScript. Ajouter un index full-text français dans une phase suivante, puis pg_trgm uniquement après mesure.

Éviter le N+1 :
- jointures/projections pour l'annuaire et les cartes ;
- charger favoris/interactions par groupes d'IDs ;
- charger commentaires, auteur et likes de façon groupée ;
- appeler le service/repository directement pendant SSR ;
- ne pas faire une requête par tag, post ou auteur dans une boucle.

Le rate limiter actuel est local au processus. Le remplacer par Redis partagé ou une table à incrément atomique et nettoyage. Ne pas faire un SELECT puis UPDATE non atomiques. Le choix Redis/PostgreSQL doit être confirmé avant exposition publique.

## 8. Cartographie des routes existantes

| Domaine | Routes actuelles | Tables/repositories cibles |
|---|---|---|
| Auth | /api/auth/signin/google, /api/auth/callback/google, /api/auth/session, /api/auth/signout | users, author_profiles, oauth_accounts, sessions |
| Profils | /api/authors, /api/authors/[id], /api/authors/available, /api/settings/profile, /api/settings/account | users, author_profiles |
| Publications | /api/posts, /api/posts/[slug], /api/posts/by-id, /api/posts/by-id/[id], /api/posts/[slug]/related | posts, post_themes, post_tags |
| Studio | /api/studio/drafts, /api/studio/drafts/[id], /api/studio/publish/[id] | posts et relations |
| Réactions | /api/posts/[slug]/like, dislike, bookmark, /api/interactions/state | post_reactions, post_bookmarks |
| Abonnements | /api/users/[id]/follow, /api/users/[id]/block | user_follows, user_blocks |
| Vues | /api/posts/[slug]/view | post_view_dedupe, posts.view_count |
| Commentaires | /api/posts/[slug]/comments, /api/comments/[id]/hide, /api/comments/[id]/like | comments, comment_likes |
| Thèmes/tags | /api/themes, /api/themes/[id], /api/tags, /api/tags/[slug], /api/tags/suggest | themes, tags, post_themes, post_tags |
| Recherche | /api/search, /api/search/suggest | repositories de recherche SQL |
| Notifications | /api/notifications, /api/notifications/read | notifications |
| Modération | /api/reports, /api/admin/reports, /api/admin/reports/[id], /api/admin/moderate, /api/admin/posts/[id] | reports, admin_audit, posts, comments |
| Admin | /api/admin/audit, /api/admin/settings | admin_audit, site_settings |
| Fichiers | /api/uploads/avatar, /api/uploads/[file] | S3 ; pas de binaire en base |

Aucune de ces routes n'est basculée vers Drizzle dans cette PR de fondation.

## 9. Seeds et données existantes

### Données de démonstration non migrables telles quelles
- EMMA_SEED, SEED_AUTHORS, SEED_POSTS ;
- commentaires, notifications et signalements seedés ;
- MOCK_TAGS et compteurs de démonstration ;
- postCount et tagCount codés en dur dans les thèmes seedés.

Les compteurs tels que 8 700 publications ou 12 400 usages ne doivent jamais être importés en production.

### Données de référence
Les 55 thèmes de lib/server/seed/themes.ts peuvent devenir des données éditoriales de référence après revue. Leur import doit uniquement créer id/slug/name/category/tagline/position/active ; les compteurs doivent être recalculés. Le script doit être idempotent par slug et ne jamais créer de compte ni de publication.

Les tags initiaux doivent être approuvés explicitement. Les suggestions automatiques ne doivent pas devenir des tags approuvés sans règle éditoriale.

### Store mémoire
Aucun dump PostgreSQL ni export transactionnel du store global n'est disponible. Les processus en cours peuvent contenir des écritures éphémères. Ne pas promettre leur migration. Si une instance persistante externe existe, il faut identifier provenance/propriétaires, exporter, dédupliquer et vérifier les droits avant import.

## 10. Variables d'environnement

| Variable | Utilisation | Quand requise |
|---|---|---|
| DATABASE_URL | URL Neon poolée runtime | lorsque les repositories seront branchés |
| DATABASE_MIGRATION_URL | URL directe/non poolée pour Drizzle Kit | génération/vérification/application de migration |
| DATABASE_POOL_MAX | taille maximale du pool par instance | facultative, défaut 5 |
| SESSION_SECRET | secret du système de session actuel | jusqu'au cutover auth |
| VIEW_HASH_SALT | hachage des vues actuel | jusqu'au cutover vues |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | OAuth Google personnalisé actuel | selon le flux auth |

Aucun secret ou URL réelle n'est ajouté au dépôt. .env.example contient des chaînes vides.

Ne pas exécuter drizzle-kit migrate dans le build, dans le démarrage Next.js ou dans un environnement preview sans procédure approuvée.

## 11. Migrations, sauvegardes et rollback

- Les changements sont versionnés dans db/migrations.
- drizzle-kit generate produit les fichiers SQL à partir de db/schema.ts.
- Relire le SQL généré, notamment les enums, FK, index partiels et opérations destructrices.
- drizzle-kit migrate est une commande opérateur explicite, lancée avec DATABASE_MIGRATION_URL.
- Ne pas utiliser drizzle-kit push en production.
- Avant toute migration de données : snapshot Neon et test de restauration.
- Utiliser expand/contract : ajouter les tables/colonnes, écrire en double si nécessaire, migrer/lire, vérifier, puis supprimer l'ancien schéma dans une release ultérieure.
- Les scripts de rollback SQL doivent être préparés et relus pour chaque migration ; une restauration de snapshot reste le dernier recours.
- Ne pas retirer lib/server/store.ts tant que tous les parcours ne sont pas branchés et testés.

## 12. Phases et critères d'acceptation

### Phase 0 — Fondation (cette PR)
Dépendances, lockfile, schéma Drizzle, config, client paresseux, documentation, migration SQL initiale générée et vérifiée sans base réelle.

Acceptation : installation figée, typecheck, lint, conventions, vérification du journal Drizzle et build passent ; la migration SQL initiale est versionnée ; aucune route métier n'utilise encore PostgreSQL.

### Phase 1 — Auth persistante
Décider OAuth personnalisé vs Better Auth ; repositories users/profiles/oauth/sessions ; persister le subject Google et les sessions ; tests expiration, révocation, suppression, multi-instance.

Acceptation : connexion/callback/session/déconnexion et compte survivent au redémarrage et fonctionnent sur deux instances.

### Phase 2 — Publications et Studio
Repositories posts/themes/tags/drafts ; publication transactionnelle, slug unique, permissions inchangées, sauvegarde concurrente et thèmes seedés explicitement.

Acceptation : brouillon/publication survivent au redémarrage ; aucun accès croisé aux brouillons.

### Phase 3 — Interactions et commentaires
Réactions exclusives, favoris, commentaires, likes de commentaires, follows/blocks, vues, notifications et compteurs atomiques.

Acceptation : tests de concurrence sans doublons, compteurs exacts et vues dédupliquées.

### Phase 4 — Modération et administration
Signalements, file, paramètres, audit, modération transactionnelle, suppression/anonymisation et rétention.

Acceptation : toute décision est atomique et auditée ; permissions validées côté serveur.

### Phase 5 — Recherche et exploitation
Recherche SQL/FTS, pagination keyset, rate limiting partagé, S3 configuré, monitoring, backups, tests de charge et reprise.

Acceptation : pas de N+1 critique, performances mesurées et restauration testée.

### Phase 6 — Cutover et retrait du store
Export/import uniquement de données approuvées, comparaison des lignes/compteurs, gel contrôlé des écritures, bascule repositories, observation/rollback, puis suppression du store dans une PR séparée.

Acceptation : toutes les routes métier utilisent la base, aucun import runtime de lib/server/store.ts, redémarrage et multi-instance validés.

## 13. Plan de tests

### Schéma et repositories
- migrations sur PostgreSQL éphémère ou PGlite ;
- unicité pseudonyme, OAuth, sessions, réactions et favoris ;
- contraintes CHECK et suppression FK ;
- pagination stable, recherche et index.

### Transactions
- deux likes simultanés du même utilisateur ;
- transition LIKE vers DISLIKE et inverse ;
- publications concurrentes au seuil quotidien ;
- favoris simultanés ;
- masquage de commentaire répété ;
- modération et audit avec rollback si l'audit échoue.

### Sécurité
- accès à un brouillon via ID ;
- accès à un texte privé via slug/ID ;
- IDOR commentaire/favori ;
- session expirée/révoquée ;
- state OAuth invalide ;
- permissions admin/modérateur ;
- XSS ;
- signalement d'une cible inexistante.

### Parcours
Playwright : OAuth de test, onboarding, Studio, brouillon, publication, like/unlike, commentaire, favori, signalement, modération et suppression de compte.

## 14. Risques et arbitrages ouverts

| Sujet | Recommandation / décision nécessaire |
|---|---|
| Auth personnalisée ou Better Auth | trancher avant Phase 1 |
| Données en mémoire | ne pas migrer sans export durable et provenance |
| Publication anonyme | conserver user_id interne nullable et snapshot public |
| Suppression compte | arbitrer anonymisation vs suppression totale |
| Fuseau quota quotidien | stockage UTC ; fuseau de calcul à décider |
| Compteurs | relations comme vérité, compteurs dénormalisés transactionnels |
| Rate limiting | Redis partagé ou compteur SQL atomique |
| S3 | fournisseur, région, URLs et rétention à confirmer |
| Recherche | FTS français avant trigram |
| Rétention vues | déduplication 90 s ; rétention à valider |

## 15. Portée exacte de la fondation

Cette livraison ajoute le modèle et le client PostgreSQL paresseux. Elle ne :
- se connecte pas à une base réelle ;
- n'exécute aucune migration sur Neon ;
- ne remplace pas le store mémoire ;
- ne persiste pas comptes, OAuth, sessions ou publications ;
- ne bascule aucune route API vers PostgreSQL ;
- ne configure aucun secret ni bucket S3 ;
- ne prouve pas la persistance multi-instance.

La migration ne sera considérée terminée que lorsque toutes les routes concernées seront branchées et testées sur PostgreSQL.
