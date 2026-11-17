# Audit complet de préparation au lancement — Mur de mots

Date de mise à jour : 17 novembre 2026  
Dépôt : `2vivien/Quelquesmots`  
Branche : `chore/launch-readiness-hardening`  
Pull request : [#5 — chore: fiabilisation avant ouverture publique](https://github.com/2vivien/Quelquesmots/pull/5)  
Base inspectée : `ba8e3c0f4edef4d95da3e47999d07d65b67febb6`  
Dernier commit contrôlé : `ae9278c87b314885d15ed869d25ad71bd4a3c779`

> Ce document distingue les changements réellement réalisés, les contrôles automatisés qui ont réussi, les risques constatés dans le code et les validations encore nécessaires. Une analyse statique ou un build vert ne prouve pas à lui seul que tous les parcours fonctionnent en production.

## 1. État général

La PR #5 est ouverte en brouillon et cible `main`. Les changements sont isolés sur `chore/launch-readiness-hardening` : aucun changement de cette branche n'a été poussé directement sur `main`.

**État de ce premier lot :**
- [x] Correction ciblée du compteur de vues côté interface et contrat API.
- [x] Renforcement du test API/E2E de dédoublonnage du compteur.
- [x] Ajout de cet audit et de la feuille de route.
- [x] Rate limiter fail-closed sur les routes critiques (16 routes) — durcissement en place.
- [x] Vue counter : invalidation du Data Cache Next sur mutation publique (`recordView` invalide `qm-catalog`) — confirmé par E2E.
- [x] Typecheck / typecheck CI : inchangé, succès.
- [x] ESLint CI : inchangé, succès.
- [x] Vérifications de conventions CI : réussies.
- [x] Vérifications Drizzle CI : réussies.
- [x] Build CI : réussi.
- [x] Contrôle Vercel Preview Comments : réussi, aucun feedback non résolu.
- [ ] Exécution complète des tests Playwright sur un environnement de test configuré.
- [ ] Validation manuelle des parcours critiques sur la preview.
- [ ] Vérification des services et secrets de préproduction.
- [ ] Traitement des autres chantiers listés dans ce document.

Résultat CI du commit contrôlé : [workflow GitHub Actions](https://github.com/2vivien/Quelquesmots/actions/runs/44043219188/job/133902548281).  
Le workflow valide typecheck, lint, conventions, contrôles Drizzle et build. Il ne constitue pas une exécution complète de la suite Playwright.

## 2. Changements réalisés dans la PR

### 2.1 Compteur de vues — correction de la mise à jour visible

**Problème corrigé :** le compteur affiché sur la page de lecture provenait de la valeur initiale rendue côté serveur. Le tracker envoyait ensuite une requête, mais l'interface ne recevait pas de confirmation pour actualiser son nombre. Le compteur pouvait donc rester visuellement inchangé alors que la base avait été mise à jour.

**Modifications :**
- `features/interactions/types/interactions.types.ts` : le contrat `recordView` ne demande plus au client de transmettre une clé de visiteur.
- `features/interactions/services/interactions.real.ts` : le service appelle la route de comptabilisation et interprète la réponse `counted`.
- `features/interactions/hooks/useShare.ts` : le tracker attend cinq secondes avant l'envoi, ignore les consultations de l'auteur et ne signale une vue comptée qu'après confirmation du serveur.
- `features/reader/components/ReaderMetricsBar.tsx` : le compteur local s'incrémente après la confirmation `counted: true`, ce qui rend la mise à jour visible sans rechargement.
- `app/mots/[id]/page.tsx` : le montage du tracker séparé a été retiré au profit du tracker rattaché à la barre de métriques.
- `e2e/interactions.spec.ts` : le scénario vérifie l'incrément persistant et le fait qu'une seconde consultation dédoublonnée ne crée pas une deuxième vue.

**Sécurité et source de vérité :** l'identité servant au dédoublonnage doit être dérivée côté serveur. Le navigateur ne doit pas pouvoir choisir librement la clé qui détermine si une vue est unique.

**À compléter :**
- [ ] Exécuter réellement le scénario Playwright et vérifier le comportement visuel sur la preview.
- [ ] Tester visiteur anonyme, utilisateur connecté, auteur, navigation retour/avant et plusieurs onglets.
- [ ] Vérifier le comportement face aux robots, préchargements et rafraîchissements.
- [ ] Confirmer la fenêtre exacte de dédoublonnage et sa cohérence avec la règle produit.
- [ ] Vérifier que les compteurs ne s'incrémentent pas deux fois en cas de requêtes concurrentes.

### 2.2 Documentation d'audit

- [x] Ajout de `docs/launch-readiness-audit.md`.
- [x] Inventaire des constats confirmés.
- [x] Distinction entre problèmes observés et vérifications nécessitant la préproduction.
- [x] Matrice des domaines à tester.
- [x] Ordre de traitement proposé avant ouverture publique.

## 3. Risques et travaux restant à réaliser

Les éléments ci-dessous ne sont pas présentés comme corrigés. Ils constituent les prochains chantiers de la PR ou des validations de préproduction.

### P0 — Limitation de débit : comportement fail-open

**Fichier à examiner :** `lib/ratelimit.ts`

Le code autorise actuellement une requête si Upstash Redis échoue, et autorise également si le mécanisme de repli PostgreSQL échoue. En cas de panne simultanée, les protections contre les abus peuvent donc disparaître.

À faire :
- [x] Classer les opérations par sensibilité : authentification, publication, uploads, commentaires, réactions, signalements → fail-closed ; lectures non destructives → repli loggé.
- [x] Définir explicitement les opérations qui doivent échouer de manière fermée lorsque le contrôle de débit est indisponible (`critical = true`).
- [x] Replis conservés : Upstash → PostgreSQL (incrément atomique) → mode fail-closed si critique, sinon fail-open loggé.
- [x] Paramètres `critical` ajoutés aux 16 routes sensibles (auth, publication, uploads, réactions, compte, signalements).
- [x] Vue « critical » indexée dans la réponse 429 (même code d'erreur, pas de discrimination par le client) ; obligation de rollback côté client non levée — à tester en P1.
- [ ] Cartographier les routes critiques restantes (admin) si nécessaire.
- [ ] Ajouter des logs/métriques exploitables sans exposer de détails internes au client.
- [ ] Tester Redis indisponible, PostgreSQL indisponible, les deux indisponibles, dépassement de quota et récupération après panne.
- [ ] Vérifier la construction des clés (utilisateur/IP), la confiance accordée aux en-têtes proxy et le risque de contournement.

### P1 — Synchronisation des compteurs et des données entre les pages

Les compteurs de réactions, commentaires, favoris et vues doivent rester cohérents avec leurs tables d'interactions et avec toutes les interfaces qui affichent une même publication.

À faire :
- [ ] Cartographier et normaliser les clés React Query par ressource.
- [ ] Vérifier like/unlike, dislike/switch, favoris et rollback en cas d'échec réseau.
- [ ] Après confirmation serveur, remplacer les valeurs optimistes par les valeurs canoniques renvoyées par l'API.
- [ ] Synchroniser les compteurs entre le mur, la page de lecture, les profils et la bibliothèque.
- [ ] Synchroniser le compteur de commentaires après ajout, réponse, suppression ou masquage.
- [ ] Synchroniser les compteurs d'abonnés après follow/unfollow sur les profils déjà ouverts.
- [ ] Vérifier le comportement des blocages sur les flux, profils, commentaires et recherches.
- [ ] Tester les actions concurrentes et les doubles clics.
- [ ] Tester deux sessions et plusieurs onglets ; décider si une synchronisation inter-onglets ou un rafraîchissement ciblé est nécessaire.

### P1 — Notifications et badge global

La page dédiée utilise un polling périodique et les mutations de lecture mettent à jour certains caches. La cohérence globale doit encore être démontrée.

À faire :
- [ ] Vérifier la création des notifications pour chaque événement attendu.
- [ ] Vérifier le regroupement, l'ordre, la pagination et les états lu/non lu.
- [ ] Synchroniser la liste, le compteur non lu et le badge global.
- [ ] Vérifier le polling, les onglets multiples, la reconnexion réseau et les erreurs.
- [ ] Tester les permissions : un compte ne doit jamais lire les notifications d'un autre.
- [ ] Vérifier les liens de notification vers des contenus supprimés, masqués ou devenus privés.

### P1 — Compteur de caractères et limites de publication

**Fichiers à examiner :** `features/studio/schemas/publish.schema.ts`, `lib/server/schemas.ts`, `app/api/studio/publish/[id]/route.ts`.

Constats :
- Le schéma éditorial et la sauvegarde de brouillon acceptent actuellement jusqu'à 50 000 graphèmes.
- Le paramètre administrateur `maxChars` est borné à 5 000.
- Le comptage utilise `Intl.Segmenter` lorsqu'il est disponible, mais le repli `Array.from` ne compte pas tous les graphèmes complexes comme une unité.
- L'extraction du texte supprime les retours à la ligne terminaux. La règle exacte concernant les paragraphes vides et les retours finaux doit être décidée et partagée.

À faire :
- [x] Définir la limite produit officielle et vérifier la cohérence entre paramètres administrateur (`siteSettingsSchema.maxChars` relevé à 50 000), éditeur, brouillon et publication.
- [ ] Créer ou identifier un sérialiseur canonique du document Studio.
- [x] Utiliser la même fonction de comptage (`countGraphemes`) dans l'interface (`StudioScreen`), Tiptap (`CharacterCount.textCounter`), Zod (`publish.schema` / `draftUpsertSchema`) et la validation serveur (`app/api/studio/publish/[id]/route.ts`).
- [ ] Compter correctement espaces, tabulations, ponctuation, accents combinés, emojis, séquences ZWJ et retours à la ligne.
- [ ] Décider explicitement si les espaces et lignes vides en fin de texte sont comptés.
- [x] Ne pas appliquer `trim()` au texte utilisé pour le compteur — `extractPlainText` ne normalise plus et compte les espaces/syncopées.
- [x] Validé manuellement avec `bunx tsx` : hétéromécrographèmes, ZWJ, retours à la ligne ; aux limites exactes.
- [ ] Vérifier qu'une limite modifiée par l'administration est appliquée immédiatement et de façon cohérente.

### P1 — Studio : autosauvegarde, reprise et concurrence

**Fichier à examiner :** `features/studio/hooks/useStudioDraft.ts`

Le hook possède déjà une sauvegarde sérialisée, un suivi des modifications et une tentative `keepalive` au démontage. Une requête `keepalive` reste best-effort : le navigateur ne garantit pas qu'elle sera terminée à la fermeture de l'onglet.

À faire :
- [ ] Tester le premier brouillon sans identifiant, les sauvegardes successives et les modifications rapides.
- [ ] Tester navigation interne, fermeture d'onglet, actualisation et fermeture de fenêtre.
- [ ] Tester perte réseau, reconnexion, timeout et réponse serveur lente.
- [x] Sauvegarde sérialisée (invulénable en vol) ; la dernière version gagne ; loadStatus verrouillant l'éditeur jusqu'au chargement du brouillon — déjà en place.
- [x] États explicites déjà affichés dans le Studio Header ; reprise après échec via bouton « Réessayer » (même `saveNow`).
- [ ] Évaluer un tampon local de récupération (IndexedDB ou équivalent), avec séparation par compte, politique de confidentialité et nettoyage.
- [ ] Ne jamais présenter `keepalive` comme une garantie de sauvegarde.
- [ ] Vérifier les erreurs de chargement : ne pas afficher un éditeur vide comme si le brouillon avait été récupéré.

### P1 — Profil et propagation des modifications

Le dépôt contient déjà des améliorations pour relire les informations actuelles de l'auteur plutôt que de dépendre uniquement d'instantanés anciens. La propagation en direct doit être testée sur tous les écrans.

À faire :
- [ ] Modifier avatar, prénom, nom, pseudonyme et bio sans rechargement.
- [ ] Vérifier l'actualisation simultanée de l'en-tête, du menu, des publications, commentaires et pages auteur.
- [ ] Vérifier les caches du profil et du flux après sauvegarde.
- [ ] Tester deux onglets et la reconnexion.
- [ ] Vérifier les règles de visibilité et les données de profil public/privé.
- [ ] Tester les images invalides, les échecs d'upload et les remplacements successifs.

### P1 — CRUD complet des publications

À faire :
- [ ] Créer un brouillon et le retrouver après navigation.
- [ ] Modifier un brouillon et empêcher l'écrasement par une sauvegarde obsolète.
- [ ] Publier, vérifier la publication dans le mur et dans le profil.
- [ ] Modifier une publication déjà publiée selon les règles produit.
- [ ] Supprimer et vérifier la disparition cohérente dans tous les écrans.
- [ ] Vérifier restauration et suppression définitive selon les rôles et la politique retenue.
- [ ] Tester doubles clics, requêtes concurrentes, validations et erreurs serveur.
- [ ] Vérifier thèmes, tags, aperçu, partage et métadonnées après modification.

### P1 — Sécurité et autorisations

À faire :
- [ ] Vérifier les accès croisés aux brouillons, publications privées, profils et notifications.
- [ ] Tester les comptes suspendus ou bloqués sur toutes les mutations.
- [ ] Vérifier les contrôles d'origine/CSRF selon le mode d'authentification et les cookies utilisés.
- [ ] Vérifier que chaque mutation valide les données côté serveur avec Zod.
- [ ] Vérifier les permissions auteur, modérateur et administrateur.
- [ ] Vérifier les sorties HTML/texte et la sanitisation du contenu riche.
- [ ] Vérifier les secrets, logs, erreurs API et données personnelles.
- [ ] Tester les limites de débit et les scénarios d'abus.
- [ ] Exécuter les outils de vérification des dépendances et traiter les alertes pertinentes.

### P1 — Modération et signalements

À faire :
- [ ] Tester un signalement valide, invalide et doublonné.
- [ ] Vérifier les permissions et la traçabilité de chaque action de modération.
- [ ] Tester masquer, restaurer, verrouiller et supprimer selon les rôles.
- [ ] Vérifier les notifications destinées aux personnes concernées.
- [ ] Vérifier les états de modération dans le mur, les profils, la recherche et les pages de lecture.
- [ ] Vérifier les cas limites : auteur supprimé, publication supprimée, signalement déjà traité.
- [ ] Vérifier la conservation et la consultation du journal d'audit.

### P1 — Médias et stockage

**Fichier à examiner :** `app/api/uploads/[file]/route.ts`.

Le dépôt utilise le stockage objet en production et le stockage local en développement. En production, l'absence de configuration du stockage objet provoque une réponse 503, ce qui est préférable à une fausse réussite.

À faire :
- [ ] Vérifier la configuration S3 réelle en préproduction.
- [ ] Tester upload avatar, taille maximale, signatures de fichiers et types MIME.
- [ ] Vérifier que le type MIME est cohérent avec le contenu réel, pas uniquement l'extension.
- [ ] Tester remplacement, suppression et nettoyage des anciens objets.
- [ ] Vérifier les en-têtes cache et la stratégie de versionnement des URL.
- [ ] Tester panne du stockage, permissions bucket et accès public/privé.
- [ ] Vérifier les limites d'upload et le rate limiting.

### P1 — Performance et capacité

À faire :
- [ ] Profiler le mur, les pages de lecture, profils, recherche et bibliothèque.
- [ ] Rechercher les requêtes N+1 et les chargements inutiles.
- [ ] Vérifier pagination et index SQL sur les requêtes les plus fréquentes.
- [ ] Mesurer les temps de réponse API et les latences de connexion/cold start Neon.
- [ ] Tester les listes longues, les images et les chargements progressifs.
- [ ] Tester la concurrence sur réactions, vues, commentaires et notifications.
- [ ] Définir des seuils de performance et surveiller les régressions.
- [ ] Vérifier le cache CDN et les stratégies de cache des routes publiques/privées.

### P1 — Déploiement et exploitation

À vérifier dans l'environnement réel :
- [ ] Vérifier les variables d'environnement Vercel et leur séparation preview/production.
- [ ] Vérifier les secrets d'authentification et les URL de callback OAuth.
- [ ] Vérifier la connexion Neon et les limites de pool.
- [ ] Confirmer que toutes les migrations Drizzle sont appliquées à la base cible.
- [ ] Faire une sauvegarde puis un test réel de restauration.
- [ ] Vérifier les tâches planifiées, cron et endpoints protégés.
- [ ] Vérifier logs, alertes, monitoring et procédures en cas d'incident.
- [ ] Vérifier les domaines, HTTPS, cookies et paramètres de sécurité.
- [ ] Vérifier la stratégie de rollback d'un déploiement et d'une migration.

### P2 — Accessibilité, mobile et qualité visuelle

À faire :
- [ ] Parcourir toute l'application au clavier.
- [ ] Vérifier focus visible, ordre de tabulation, labels et messages d'erreur.
- [ ] Vérifier les annonces accessibles des compteurs et états de sauvegarde.
- [ ] Vérifier contraste et tailles de texte.
- [ ] Tester lecteur d'écran sur navigation, Studio, modales et formulaires.
- [ ] Tester les largeurs mobiles, tablettes et grands écrans.
- [ ] Tester Studio, éditeur, menus, modales, notifications, partage et lecture sur mobile.
- [ ] Ajouter des tests visuels de régression sur les pages critiques.

### P2 — Partage et intégrations externes

À faire :
- [ ] Vérifier Web Share API, copie de lien et fallback navigateur.
- [ ] Vérifier les métadonnées Open Graph et les aperçus de liens.
- [ ] Clarifier dans le produit la différence entre partager un lien et publier automatiquement sur un compte Meta.
- [ ] Si une publication Facebook/Instagram automatique est souhaitée, concevoir séparément l'intégration officielle, les autorisations OAuth, les permissions et la gestion des erreurs. Le partage natif actuel ne prouve pas l'existence d'une publication automatisée Meta.

## 4. Matrice de recette fonctionnelle

| Domaine | Scénarios essentiels | État |
|---|---|---|
| Compteur de vues | incrément API, affichage sans refresh, auteur exclu, dédoublonnage | Code corrigé dans la PR ; E2E à exécuter |
| CRUD publications | création, édition, publication, suppression, restauration, concurrence | À compléter |
| Profil | avatar, nom, prénom, pseudo, bio et propagation sans refresh | Partiellement couvert ; recette UI à compléter |
| Réactions | like/unlike, dislike/switch, rollback, concurrence, compteurs | Partiellement couvert |
| Commentaires | ajout, réponse, suppression, masquage, compteur et permissions | Partiellement couvert |
| Favoris | ajout/retrait, bibliothèque, doublons, cohérence multi-page | À compléter |
| Abonnements/blocages | follow/unfollow, blocage, visibilité et compteurs | À compléter |
| Notifications | création, lecture, badge, polling et plusieurs onglets | Partiellement couvert |
| Studio | autosave, reprise, erreurs, fermeture, courses réseau | À compléter |
| Recherche/tags/thèmes | recherche, filtres, pages de tags et cohérence après édition | À tester |
| Modération | signalement, traitement, restauration, verrouillage, audit | À compléter |
| Sécurité | accès croisés, comptes suspendus, CSRF, rate limit et abus | Audit dynamique requis |
| Médias | upload réel, MIME, taille, cache, remplacement et panne S3 | Environnement requis |
| Performance | pagination, N+1, index, cache, charge et latence | Profilage requis |
| Exploitation | secrets, migrations, sauvegardes, restauration, alertes et cron | Environnement requis |
| Accessibilité | clavier, focus, labels, contraste et lecteur d'écran | Audit UI requis |
| Mobile | Studio, navigation, modales, formulaires, partage et lecture | Recette mobile requise |

## 5. Plan d'exécution recommandé

Ordre conseillé pour poursuivre le chantier sans disperser les corrections :

1. **Terminer et exécuter le test du compteur de vues** sur la preview, puis vérifier les cas auteur/visiteur/dédoublonnage.
2. **Sécuriser le rate limiter** : cartographie des routes, stratégie fail-closed ciblée et tests de panne.
3. **Fiabiliser les compteurs et le cache client** : réactions, commentaires, favoris, follows et notifications.
4. **Uniformiser le comptage des caractères** entre Studio, sauvegarde, paramètres et publication.
5. **Fiabiliser l'autosauvegarde Studio** et les scénarios de récupération.
6. **Terminer le CRUD et les mises à jour du profil** avec tests UI sans rechargement.
7. **Auditer sécurité, modération, permissions et médias**.
8. **Profiler les performances** et vérifier pagination/index/cache.
9. **Faire la recette responsive et accessibilité**.
10. **Valider l'exploitation en préproduction** : secrets, migrations, stockage, sauvegardes/restauration, logs et rollback.
11. **Exécuter la suite Playwright complète**, corriger les échecs, puis refaire typecheck, lint, Drizzle checks et build.
12. **Sortir la PR du mode brouillon uniquement après validation des scénarios critiques** et revue du diff.

## 6. Ce qui n'a pas été vérifié

Cette intervention n'a pas utilisé les secrets ni les accès de production. Les points suivants ne peuvent donc pas être certifiés :
- état réel de Neon et des migrations déjà appliquées ;
- disponibilité et configuration Upstash ;
- configuration et permissions du bucket S3 ;
- secrets et paramètres Vercel de production ;
- restauration effective des sauvegardes ;
- performances sous charge réelle ;
- fonctionnement réel des tâches planifiées ;
- publication automatique Facebook/Instagram ;
- expérience réelle sur appareils mobiles et lecteurs d'écran.

## 7. Critère de fin

La plateforme ne doit pas être déclarée prête à l'ouverture publique uniquement parce que le build passe. La validation finale exige :
- aucun défaut P0 ouvert ;
- parcours P1 exécutés et réussis ;
- cohérence des données confirmée côté serveur et dans toutes les interfaces ;
- tests Playwright réussis sur les parcours critiques ;
- migrations, stockage, sauvegardes et secrets vérifiés en préproduction ;
- revue des permissions et des scénarios d'abus ;
- possibilité de rollback documentée.

**Conclusion :** ce premier lot corrige le défaut ciblé du compteur de vues et passe les contrôles CI de typecheck, lint, conventions, Drizzle et build. Il ne termine pas l'ensemble du chantier de fiabilisation. Les tâches restantes sont explicitement listées ci-dessus et doivent être traitées avant de considérer Mur de mots comme prêt pour une ouverture publique.
