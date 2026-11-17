# Audit de préparation au lancement — Mur de mots

Date de l'audit : 17 novembre 2026  
Branche de travail : `chore/launch-readiness-hardening`  
Base inspectée : `ba8e3c0f4edef4d95da3e47999d07d65b67febb6`

> Cet audit est une inspection statique du dépôt. Les points qualifiés de « à vérifier en environnement » ne sont pas présentés comme des défauts confirmés : ils exigent une exécution réelle, les secrets et/ou l'accès à la base de production.

## Résumé exécutif

Le dépôt possède déjà une base fonctionnelle assez complète : API séparées, services par fonctionnalité, schéma PostgreSQL/Drizzle, contraintes d'unicité, opérations transactionnelles dans le repository, limitation de débit, modération et tests Playwright. Il ne faut donc pas réécrire la plateforme. Il faut renforcer les zones de cohérence et vérifier les parcours bout en bout.

### Correction réalisée dans cette branche

- Le compteur de vues affiché sur la page de lecture était rendu depuis la valeur initiale serveur uniquement.
- Le tracker attend cinq secondes puis appelle l'API, mais l'interface ne recevait aucun signal de succès et conservait l'ancien nombre.
- Le tracker est maintenant rattaché à la barre de métriques. Il incrémente l'affichage uniquement si l'API confirme `counted: true`.
- La clé du lecteur est dérivée côté serveur (session ou empreinte IP) : le client ne doit pas pouvoir choisir l'identité utilisée pour dédoublonner.
- Le test E2E vérifie désormais que le compteur en base augmente exactement de un, et qu'une seconde requête dédoublonnée ne l'augmente pas.
- Limite : cette correction locale n'est pas encore validée par une exécution CI / Playwright dans cet environnement.

## Constats confirmés

### P0 — Limitation de débit en mode fail-open

Fichier : `lib/ratelimit.ts`

Si Upstash Redis échoue, ou si le repli PostgreSQL échoue, `checkRateLimit` autorise la requête (`fail-open`). Le comportement est documenté dans le code, mais en production il signifie qu'une panne du service de limitation supprime la protection contre les abus sur les routes sensibles.

Actions :
- décider explicitement quelles routes doivent être fail-closed (auth, publication, upload, signalement, interactions coûteuses) ;
- conserver éventuellement un repli DB si son état est sain ;
- alerter et journaliser avec métriques, sans exposer les détails internes au client ;
- tester panne Redis, panne DB et dépassement normal.

### P1 — Cohérence des compteurs et synchronisation

- Les compteurs de likes, dislikes, commentaires, favoris et vues sont stockés sur les publications alors que les tables d'interactions sont la source de vérité.
- Les mutations de likes/favoris sont optimistes côté client et invalident certains caches. Les tests API vérifient les compteurs principaux, mais la couverture UI des états simultanés, des erreurs et des autres onglets reste à compléter.
- Les commentaires invalident la liste de commentaires après ajout, mais la synchronisation du compteur visible dans l'en-tête de lecture doit être vérifiée explicitement.
- Les abonnements invalident les requêtes auteurs et flux ; il faut vérifier les compteurs sur les pages profil déjà ouvertes.
- Les notifications utilisent un polling de 10 secondes sur la page dédiée et mettent à jour les caches de lecture. Le badge global, la liste et le compteur doivent être vérifiés ensemble.

Actions :
- standardiser les clés React Query par ressource et les mutations optimistes avec rollback ;
- après confirmation serveur, remplacer les valeurs provisoires par les valeurs canoniques retournées ;
- synchroniser toutes les vues d'une même ressource (mur, détail, profil, bibliothèque, commentaires, badge notifications) ;
- ajouter des tests E2E avec deux sessions et plusieurs onglets.

### P1 — Limites de caractères configurables

Fichiers : `features/studio/schemas/publish.schema.ts`, `lib/server/schemas.ts`, `app/api/studio/publish/[id]/route.ts`, `lib/server/schemas.ts`

- Le schéma éditorial exporte une limite statique de 50 000 graphèmes.
- La sauvegarde de brouillon accepte jusqu'à 50 000 graphèmes.
- La publication applique les paramètres de site en base ; le schéma des paramètres administrateur borne actuellement `maxChars` à 5 000.
- Le comptage des graphèmes utilise `Intl.Segmenter`, mais son repli `Array.from` compte des points de code et non des graphèmes complets pour toutes les séquences combinées.
- L'extraction du texte retire les sauts de ligne terminaux avec `replace(/\\n+$/g, "")`. Il faut décider précisément si les paragraphes vides et retours finaux doivent faire partie du nombre affiché, puis appliquer cette même règle partout.

Actions :
- définir une seule limite produit et un seul sérialiseur canonique du document ;
- partager la règle de comptage entre éditeur, sauvegarde et publication ;
- valider les espaces, tabulations, retours à la ligne, paragraphes vides, accents combinés et emojis ;
- tester exactement la limite, puis limite + 1 ;
- ne jamais utiliser `trim()` pour le compteur ; réserver le trim à la validation du contenu vide si la règle éditoriale le demande.

### P1 — Autosauvegarde et sortie du Studio

Fichier : `features/studio/hooks/useStudioDraft.ts`

Le hook contient déjà une sauvegarde sérialisée, un suivi des modifications et un envoi `keepalive` au démontage. Ce dernier reste une tentative best-effort : le navigateur ne garantit pas l'achèvement d'une requête asynchrone à la fermeture d'un onglet ou d'une fenêtre.

Actions :
- tester navigation interne, fermeture onglet, perte réseau, réponse lente, sauvegardes répétées et premier enregistrement sans ID ;
- conserver une récupération locale temporaire si le produit accepte cette donnée sur l'appareil, avec politique de nettoyage et prise en compte du compte connecté ;
- afficher clairement les états enregistré / enregistrement / erreur et offrir une reprise ;
- ne jamais présenter une sauvegarde keepalive comme une garantie de persistance ;
- vérifier qu'un échec de chargement d'un brouillon ne donne pas silencieusement l'impression que le contenu a été récupéré.

### P1 — Configuration de sécurité du build

Fichier : `next.config.ts`

`eslint.ignoreDuringBuilds: true` désactive ESLint pendant le build Next.js. Le workflow CI exécute actuellement lint séparément, ce qui est acceptable si les protections de branche exigent effectivement le workflow. Il faut confirmer que les checks CI sont requis avant fusion et que les déploiements ne contournent pas ces checks.

## Points déjà présents à conserver et à tester

- Contraintes d'unicité en base sur réactions, favoris, follows, username normalisé et associations publication/thème/tag.
- Contraintes de non-négativité des compteurs et interdiction de s'auto-suivre.
- Routes API avec validation Zod, contrôle d'authentification et limites de débit sur de nombreuses mutations.
- Accès aux brouillons contrôlé par la session ; publication réservée à l'auteur et vérifiée côté serveur.
- Visibilité des publications vérifiée pour les lectures et commentaires.
- Signalements, actions de modération et journal d'audit administrateur présents.
- Upload avatar limité en taille et vérifié par signature de fichier ; stockage objet requis en production.
- Notifications listées sans cache partagé, lecture limitée aux notifications du compte connecté.
- Tests E2E couvrant déjà une partie des interactions, utilisateurs, suppressions et Studio.

## Matrice de vérification avant ouverture

| Domaine | Vérifications obligatoires | État |
|---|---|---|
| CRUD publications | créer, lire, modifier brouillon, publier, supprimer, restaurer selon rôle, double clic, conflit de sauvegarde | À exécuter |
| Profil | avatar, prénom, nom, pseudo, confidentialité, pages auteur et contenus déjà ouverts | Partiellement couvert |
| Vues | incrément en base, affichage immédiat, auteur exclu, robots exclus, dédoublonnage, visiteur et connecté | Test API renforcé ; UI à exécuter |
| Réactions | like/unlike, dislike/switch, deux requêtes concurrentes, rollback réseau, compteurs sur flux et détail | Partiellement couvert |
| Commentaires | ajout, réponse, like, masquage, compteur, permissions auteur/modérateur | Partiellement couvert |
| Favoris | ajout/retrait, bibliothèque, doublons, synchronisation multi-page | À compléter |
| Abonnements / blocages | follow/unfollow, blocage, visibilité et compteurs | À compléter |
| Notifications | création, regroupement, lecture, badge global, polling, plusieurs onglets | Partiellement couvert |
| Modération | signalement doublonné, traitement, restauration, verrouillage, audit complet | À compléter |
| Sécurité | accès croisés, compte suspendu, CSRF/origines, abus, rate limit en panne, données privées | Audit dynamique requis |
| Médias | upload réel, type MIME, taille, cache, remplacement/suppression, panne S3 | Environnement requis |
| Performance | pagination, requêtes N+1, index, cache, charge simultanée, latence Neon | Profilage requis |
| Exploitation | secrets, migrations réellement appliquées, sauvegardes restaurables, alertes, logs et cron | Environnement requis |
| Accessibilité | clavier, focus, labels, annonces des compteurs, contraste, lecteur d'écran | Audit UI requis |
| Mobile | Studio, navigation, modales, formulaires, partage et lecture | E2E visuel requis |

## Ordre d'exécution recommandé

1. Terminer les tests de synchronisation des données et des compteurs.
2. Renforcer la limitation de débit et tester les permissions négatives.
3. Uniformiser la règle de comptage et les limites de publication.
4. Terminer les scénarios de récupération du Studio.
5. Vérifier les notifications, favoris, abonnements, blocages et modération.
6. Exécuter typecheck, lint, conventions, Drizzle check, build et E2E.
7. Faire les tests de charge, restauration de sauvegarde et contrôle des secrets sur l'environnement de préproduction.
8. Ouvrir la plateforme seulement après validation des scénarios P0/P1 et des parcours critiques.

## Limites de cet audit

Aucun accès aux variables secrètes, à Neon de production, à Upstash, au bucket S3, aux paramètres Vercel ni aux comptes Meta n'a été utilisé. L'état réel des migrations en production, la restauration des sauvegardes, les performances sous charge et la publication Facebook/Instagram ne peuvent donc pas être certifiés par la seule lecture du dépôt.
