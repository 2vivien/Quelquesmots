# Audit technique — Quelquesmots

Date de l'audit : 14 novembre 2026  
Branche de corrections : `fix/persistence-and-backend-audit`  
Périmètre : parcours publics, authentification, routes API, services frontend, stockage, recherche, interactions, bibliothèque, configuration et conventions visibles dans le dépôt.

## 1. Conclusion exécutive

Le projet dispose d'une interface riche et d'un ensemble conséquent de routes API, mais **il ne dispose pas encore d'un backend persistant**. Les adaptateurs frontend nommés `*.real.ts` appellent bien les routes Next.js ; ces routes délèguent toutefois leurs opérations à `lib/server/store.ts`, qui conserve les données dans des tableaux et des `Map` en mémoire, initialisés avec des jeux de démonstration.

En conséquence, une écriture peut sembler réussir sans être durable : un redémarrage, une nouvelle instance serverless ou une autre instance du serveur ne retrouve pas nécessairement les mêmes données. Ce backend ne doit pas être considéré comme prêt pour une mise en production avec de vrais utilisateurs.

La présence de `DATABASE_URL` dans `.env.example` ne change pas ce constat : le dépôt ne contient pas de schéma Drizzle, de migrations applicatives ni de connexion PostgreSQL/Neon utilisée par les routes. La documentation d'architecture décrit Better Auth et Drizzle, mais ils ne sont pas installés ni reliés au code courant.

## 2. Défauts confirmés

### P0 — Persistance inexistante

- `lib/server/store.ts` crée un état global `globalThis.__qmStore`.
- `seedDb()` recharge des auteurs, publications, commentaires, notifications, signalements et tags de démonstration.
- Les likes, favoris, abonnements, blocages, vues, brouillons, paramètres, audit et sessions métier sont conservés en mémoire.
- `app/api/auth/callback/google/route.ts` conserve aussi la relation Google subject → utilisateur dans une `Map` globale.
- Aucune migration de données vers PostgreSQL n'est présente.

**Conséquence :** perte ou divergence de données entre redémarrages et instances. La migration PostgreSQL doit couvrir les comptes, comptes OAuth, profils, publications, thèmes, tags, commentaires, interactions, favoris, vues, notifications, signalements, paramètres et audit.

### P0 — Authentification différente de la documentation

- Le projet utilise des routes OAuth Google personnalisées et une session HMAC dans `lib/server/session.ts`.
- Better Auth/NextAuth n'est pas utilisé par le code courant.
- Le callback OAuth et les utilisateurs restent adossés au store en mémoire.
- La déconnexion efface le cookie du navigateur, mais la session n'est pas une ligne de session révocable en base.

**Conséquence :** l'identité Google et les sessions ne sont pas durables ni administrables comme le serait un système d'authentification lié à une base.

### P1 — Limitation de débit locale

`lib/ratelimit.ts` conserve ses compteurs dans une `Map` locale. Les limites ne sont donc pas partagées entre les instances. Une limitation de débit partagée (Redis/Upstash ou stockage PostgreSQL atomique) reste nécessaire avant une exposition publique.

### P1 — Uploads locaux non durables

Les avatars peuvent être écrits dans `.uploads/`. Ce comportement ne convient pas à une plateforme serverless en production. La branche d'audit impose maintenant le stockage S3 configuré en production et réserve le disque local au développement. Il reste à configurer et tester le bucket de production.

### P1 — Appels internes SSR

Les pages serveur utilisent des adaptateurs frontend qui font un `fetch` HTTP vers leurs propres routes API via `apiUrl()`. C'est un détour évitable pendant le rendu serveur, qui ajoute une connexion et peut perdre le contexte de session. Une couche de requêtes serveur (service/repository) doit être appelée directement par les Server Components ; le navigateur doit continuer à utiliser les routes/contrats publics.

### P1 — Gestion des erreurs frontend

Plusieurs adaptateurs transformaient les erreurs HTTP en listes vides, `null`, un état d'interaction vide ou des tags par défaut. Cela confondait panne serveur et absence de contenu. La branche fait maintenant remonter les erreurs sur les services principaux : authentification, auteurs, commentaires, interactions, notifications, modération, recherche, tags, thèmes et administration. Certains comportements de lecture non critiques restent à examiner au fil des tests.

### P1 — Requêtes N+1 et agrégations répétées

- La bibliothèque chargeait chaque favori par un appel HTTP séparé. Une route groupée et `getByIds()` réduisent cela à une requête contenant jusqu'à 100 IDs et ne renvoient que les résumés visibles.
- `listAuthors()` recalculait les statistiques de chaque auteur en rescannant les publications et abonnements. Le code calcule maintenant les agrégats en un passage.
- `listThemes()` rescannait les publications pour chaque thème. Le comptage est maintenant agrégé en un passage.
- Les écrans plus complexes doivent encore être profilés avec des volumes de données réels ; cet audit ne permet pas de garantir l'absence de tout N+1.

### P1 — Contrôle de visibilité par identifiant

Certaines routes de lecture acceptaient un identifiant interne et contournaient le contrôle de visibilité lorsqu'elles trouvaient directement l'enregistrement. Les routes de lecture, similaires, vues, likes, dislikes, favoris et commentaires vérifient maintenant `canViewPost` même lorsque l'URL contient un ID.

### P2 — Dépendances et qualité

- `package.json` identifie encore le projet comme `ai-studio-applet`.
- `next` est en version majeure 15 tandis que `eslint-config-next` est en majeure 16.
- `next.config.ts` désactive ESLint pendant `next build`.
- Aucun script `test` n'est défini.
- Une CI GitHub Actions a été ajoutée sur cette branche pour exécuter typecheck, lint, conventions et build. Aucun résultat n'est encore disponible avant l'ouverture/exécution de la PR.
- Le script `scripts/check-conventions.ts` existe, mais il n'a pas pu être exécuté depuis le connecteur GitHub.

## 3. Corrections présentes sur cette branche

- Suppression de la connexion de démonstration lorsque les identifiants Google sont absents.
- Secret de session obligatoire en production et longueur minimale de 32 octets ; durée du cookie ramenée à 30 jours.
- Sel de hachage des vues obligatoire en production et longueur minimale de 32 octets.
- Contrôle de visibilité appliqué aux routes de publication, de lecture similaire, de vue et d'interaction/commentaire par ID.
- Paramètre `limit` propagé et validé sur le flux.
- Données SSR initiales conservées 30 secondes côté client afin d'éviter un re-fetch immédiat ; la page utilisateur authentifié ne réutilise pas une page SSR anonyme.
- Chargement groupé des favoris (jusqu'à 100 textes) et réponse en résumé afin de réduire le nombre d'appels et le volume transféré.
- Comptage des publications par thème et auteur agrégé en un seul passage.
- Compteurs de likes/dislikes et de suivis corrigés : ils tiennent compte de l'état initial chargé, attendent le chargement de l'état utilisateur et réconcilient les listes après mutation.
- Aucun compte, publication, commentaire, notification, signalement, thème ou tag de démonstration n'est chargé en production. Les thèmes et tags initiaux devront être créés comme données de référence lors de la migration PostgreSQL.
- Erreurs HTTP des adaptateurs remontées au lieu de fausses listes vides.
- Stockage local d'avatars interdit en production ; le stockage objet doit être configuré.
- Configuration d'URL canonique validée ; `APP_URL` serveur est prioritaire.
- `.env.example` corrigé pour ne plus laisser croire que `DATABASE_URL` active déjà PostgreSQL.

## 4. Travaux bloquants restants

1. Installer et verrouiller une stack de persistance (par exemple PostgreSQL/Neon + Drizzle), créer le schéma et les migrations.
2. Remplacer entièrement `lib/server/store.ts` par des repositories PostgreSQL asynchrones et migrer chaque route/service vers ceux-ci.
3. Ajouter les tables de liaison Google OAuth et de sessions ; supprimer les `Map` de sujets Google et les comptes/auteurs/textes seedés du parcours réel.
4. Migrer le contrôle des rôles et les permissions dans les données persistantes, avec contraintes d'unicité et transactions sur les compteurs.
5. Remplacer le rate limiting local par un mécanisme partagé.
6. Configurer et tester le stockage S3 en production.
7. Éliminer les appels HTTP internes pendant le rendu serveur ; transmettre proprement l'identité de session aux requêtes qui en ont besoin.
8. Harmoniser les versions Next.js et eslint-config-next ; réactiver le lint en CI.
9. Ajouter Vitest/Playwright, des tests de sécurité (IDOR, visibilité, accès aux brouillons, OAuth, CSRF, XSS) et un pipeline CI.
10. Faire un audit de performance sur base persistante avec un volume d'essai réaliste.

## 5. Vérification

Les modifications ont été enregistrées dans des commits GitHub sur cette branche. L'environnement de travail disponible ici permet de lire et modifier le dépôt via GitHub, mais pas de cloner le projet, d'installer les dépendances ou d'exécuter les commandes du dépôt. Par conséquent, **typecheck, lint, build, tests et QA navigateur ne sont pas déclarés réussis**. Ils doivent être exécutés dans un environnement de développement connecté au dépôt avant fusion.

Commandes attendues :

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run check
bun run build
```

## 6. Décision de mise en production

Ne pas présenter cette branche ni la branche principale comme un backend persistant prêt pour de vrais comptes et textes. Les corrections de sécurité et de qualité réduisent certains risques, mais la migration PostgreSQL est le prérequis bloquant pour assurer la conservation des données et la cohérence multi-instance.
