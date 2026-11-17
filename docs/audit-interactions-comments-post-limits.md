# Audit ciblé — Likes, commentaires et limites des publications

Date : 17 novembre 2026  
Dépôt : `2vivien/Quelquesmots`  
Branche source auditée : `main`  
Commit exact audité : [`4471e54`](https://github.com/2vivien/Quelquesmots/commit/4471e54a59f2b0b87aff1d63c4768f4a3bc851b7)  
Message : `fix(studio): compteur Tiptap aligné sur countGraphemes (même référence que l'UI et le serveur)`

> Audit statique du code de `main` à ce commit. Les constats de code sont distingués des hypothèses de comportement à reproduire en navigateur. Aucun changement fonctionnel n'est effectué dans cet audit.

## 1. Conclusion principale : une cause probable et précise du retour du compteur de likes

**Fichier :** `features/interactions/hooks/useLike.ts`  
**Référence complémentaire :** `features/interactions/hooks/useInteractionState.ts`

Le compteur affiché est calculé ainsi :

`initialCount + Number(liked) - Number(baselineLiked)`

Le même principe est utilisé pour les dislikes. Or :
1. `initialCount` est fourni par la publication rendue (carte du flux ou page de lecture).
2. `liked` vient du cache React Query `["interactions", userId]`, qui reçoit la mise à jour optimiste.
3. `baselineLiked` vient d'un second cache `["interactions-baseline", userId]`.
4. Après la mutation, `onSettled` invalide à la fois les interactions et le flux.
5. Au rechargement de `["interactions", userId]`, `useInteractionState.queryFn` écrit immédiatement le nouvel état serveur dans `interactions-baseline`.
6. Si le compteur de la publication n'a pas encore été rafraîchi, le calcul soustrait alors la réaction qui vient d'être confirmée, mais conserve l'ancien `initialCount`.

**Conséquence concrète :** l'utilisateur clique « J'aime », le nombre augmente de manière optimiste, puis peut revenir à l'ancien nombre lorsque le cache de référence se met à jour. Le flux peut ensuite afficher le nouveau total si sa requête se rafraîchit. Sur la page de lecture, `ReaderMetricsBar` reçoit un `PostRecord` serveur et ne possède pas de requête React Query de publication à invalider : le compteur peut donc rester à l'ancien total après la confirmation de la réaction.

C'est une cause directement visible dans le code et elle correspond très fortement au symptôme décrit. **Elle explique le retour du nombre affiché ; elle ne prouve pas à elle seule que la réaction en base est annulée.** L'icône et l'état réel doivent être contrôlés séparément pendant la reproduction.

### Correction d'architecture recommandée

- [ ] Supprimer la dépendance à deux caches indépendants pour calculer un compteur.
- [ ] Choisir une seule source de vérité client pour la réaction et le compteur.
- [ ] Faire renvoyer par l'API la réaction confirmée et les compteurs canoniques de la publication (`liked`, `likeCount`, `dislikeCount`) ou mettre à jour explicitement tous les caches de publication concernés.
- [ ] Mettre à jour sans délai le compteur de la carte, de la page de lecture, du profil et des autres listes.
- [ ] Ne pas retirer l'incrément optimiste tant que le compteur serveur correspondant n'a pas remplacé la valeur initiale.
- [ ] En cas d'erreur, rollback uniquement la mutation concernée sans écraser les autres mutations en cours.
- [ ] Ajouter un test navigateur qui observe le nombre avant clic, juste après clic, après réponse API et après refetch.
- [ ] Vérifier la persistance par une lecture API distincte après le clic.

## 2. Likes et dislikes des publications

### Ce qui est déjà correct côté serveur

**Fichiers :**
- `app/api/posts/[postId]/like/route.ts`
- `app/api/posts/[postId]/dislike/route.ts`
- `lib/server/repository.ts`

Points positifs observés :
- authentification obligatoire ;
- validation UUID de la publication ;
- vérification de la visibilité pour le lecteur ;
- limitation de débit ;
- modification en transaction ;
- verrouillage de la publication avec `FOR UPDATE` pour sérialiser les réactions concurrentes ;
- unicité de la réaction utilisateur/publication ;
- incrément et décrément du compteur dans la même transaction que l'insertion ou la suppression de la réaction ;
- bascule exclusive LIKE/DISLIKE ;
- notification de l'auteur lors d'un nouveau like.

Le mécanisme SQL protège donc mieux les données persistées que l'interface ne protège actuellement l'affichage.

### Problèmes côté client à traiter

**Fichier :** `features/interactions/hooks/useLike.ts`

- [ ] Corriger le calcul `initialCount + liked - baselineLiked` et son équivalent dislike.
- [ ] Ne pas lancer deux mutations contradictoires sur la même publication simultanément.
- [ ] Empêcher les doubles clics pendant la mutation avec un état de désactivation réel des boutons, pas seulement une garde dans le callback.
- [ ] Éviter que le rollback d'une mutation restaure un instantané global devenu obsolète et écrase une autre réaction faite entre-temps.
- [ ] Vérifier les changements LIKE → DISLIKE → LIKE, et les retraits, en clics successifs et en requêtes concurrentes.
- [ ] Vérifier la cohérence quand plusieurs cartes du même post sont montées simultanément.
- [ ] Vérifier les changements de compte/session et le cache associé à l'ancien utilisateur.
- [ ] Tester l'échec réseau, 401, 403, 404, 429 et réponse serveur invalide.

**Fichier :** `features/interactions/components/LikeButton.tsx`

- [ ] Exposer un état pending accessible et désactiver temporairement les deux actions pendant une transition.
- [ ] Vérifier que le libellé accessible décrit bien l'état courant et l'action disponible.
- [ ] Vérifier que le compteur n'annonce pas deux fois la même mise à jour au lecteur d'écran.

### Couverture de tests existante et manquante

`e2e/interactions.spec.ts` vérifie actuellement le comportement des routes API et les compteurs persistés. Ce test ne clique pas dans le vrai composant React et ne peut donc pas détecter le clignotement du compteur.

À ajouter :
- [ ] Test Playwright navigateur : cliquer une fois et observer que le nombre ne revient jamais à l'ancien total.
- [ ] Test navigateur sur la page de lecture.
- [ ] Test navigateur sur le flux et sur plusieurs cartes/pages.
- [ ] Test LIKE → DISLIKE et DISLIKE → LIKE.
- [ ] Test double clic et clics rapides sur les deux boutons.
- [ ] Test d'erreur réseau avec vérification du rollback.
- [ ] Vérifier simultanément l'icône, `aria-pressed`, le compteur affiché et la valeur persistée côté API.

## 3. Likes des commentaires

### État actuel

**Fichiers :**
- `features/comments/components/CommentItem.tsx`
- `features/comments/hooks/useComments.ts`
- `app/api/comments/[id]/like/route.ts`
- `lib/server/repository.ts` — `toggleCommentLike`

Le serveur verrouille le commentaire, ajoute ou retire le like dans une transaction et renvoie `liked` ainsi que le nombre canonique de likes. C'est une bonne base.

### Défauts et risques client observés

- Le bouton de like d'un commentaire n'est pas désactivé pendant la mutation.
- `useComments.likeMutation` n'effectue pas de mise à jour optimiste : le retour visuel attend la réponse.
- Deux clics rapides peuvent lancer deux requêtes toggle. Comme il s'agit d'une opération de bascule, deux requêtes peuvent annuler l'effet l'une de l'autre.
- Les réponses réseau peuvent arriver dans un ordre différent de celui des clics ; le dernier résultat reçu peut alors écrire un état plus ancien dans le cache.
- Le hook met à jour seulement la liste `["comments", postId]` actuellement chargée ; les autres affichages éventuels du même commentaire ne sont pas synchronisés.

À faire :
- [ ] Désactiver le bouton pendant la mutation ou gérer une file de bascules déterministe.
- [ ] Empêcher les requêtes concurrentes pour le même commentaire.
- [ ] Réconcilier le cache avec la réponse canonique du serveur.
- [ ] Tester double clic, réseau lent, réponse inversée, erreur et deux onglets.
- [ ] Vérifier la notification COMMENT_LIKE et son anti-doublonnage.
- [ ] Vérifier qu'un commentaire masqué/supprimé ne peut plus recevoir de like.

## 4. Création, réponses et masquage des commentaires

### Points positifs côté serveur

**Fichiers :**
- `app/api/posts/[postId]/comments/route.ts`
- `app/api/comments/[id]/hide/route.ts`
- `lib/server/repository.ts`

- L'auteur du commentaire est dérivé de la session.
- Le texte et le parent sont validés.
- Le commentaire parent doit être visible et appartenir à la même publication.
- La création et l'incrément du compteur de commentaires sont transactionnels.
- Le masquage ne décrémente le compteur que lors de la transition depuis VISIBLE.
- Les notifications de commentaire et de réponse sont gérées côté serveur.

### Synchronisation incomplète de l'interface

**Fichiers :** `features/comments/hooks/useComments.ts`, `features/comments/components/CommentList.tsx`, `features/reader/components/ReaderMetricsBar.tsx`, `features/feed/components/PostMetrics.tsx`

- Après ajout ou masquage, `useComments` invalide la liste des commentaires, mais ne met pas à jour le compteur de commentaires de la publication dans toutes les interfaces.
- Le titre de `CommentList` utilise `comments.length`, tandis que la barre de métriques de lecture utilise `post.commentCount` reçu du serveur. Ce sont deux affichages séparés qui peuvent diverger après une mutation.
- Le flux n'invalide pas explicitement ses requêtes après ajout/masquage d'un commentaire.
- Le compteur affiché dans `ReaderMetricsBar` est une propriété serveur initiale ; aucune mise à jour locale ne lui est appliquée.

À faire :
- [ ] Faire renvoyer le compteur canonique après ajout/masquage ou l'actualiser dans un cache publication partagé.
- [ ] Synchroniser compteur dans le flux, compteur dans la lecture et titre de la discussion.
- [ ] Tester ajout, réponse, masquage par auteur, masquage par auteur du post et modérateur.
- [ ] Tester le masquage répété et vérifier qu'il ne décrémente jamais deux fois.
- [ ] Tester les commentaires et réponses en plusieurs onglets.
- [ ] Vérifier l'état après suppression ou modération d'une publication.

### Perte du texte en cas d'erreur de publication d'un commentaire

**Fichier :** `features/comments/components/CommentForm.tsx`

Le formulaire vide son champ immédiatement après avoir appelé `onSubmit`, sans attendre que la mutation serveur réussisse. Si la requête échoue, le texte saisi peut être perdu.

À faire :
- [ ] Ne vider le champ qu'après confirmation de création.
- [ ] Conserver le texte en cas d'erreur réseau/serveur.
- [ ] Afficher un état de soumission et empêcher les soumissions multiples.
- [ ] Vérifier que la réponse à un commentaire conserve le bon parent en cas d'échec.

## 5. Limites de caractères des publications

### Règle actuelle

**Fichiers :**
- `features/studio/schemas/publish.schema.ts`
- `features/studio/components/EditorSurface.tsx`
- `features/studio/components/CharCounter.tsx`
- `features/studio/components/StudioScreen.tsx`
- `features/studio/hooks/usePublish.ts`
- `app/api/studio/publish/[id]/route.ts`
- `lib/sanitize.ts`

Le plafond éditorial déclaré dans le Studio est de **50 000 graphèmes**. Le dernier commit `4471e54` a justement aligné le compteur Tiptap sur `countGraphemes`, qui est également utilisé par l'interface et la validation de publication. C'est une correction utile et cohérente.

### Ce que l'interface doit afficher à la limite

Comportement attendu :
- avant la limite : afficher le nombre courant et le maximum, par exemple `49 999 / 50 000` ;
- à la limite : afficher `50 000 / 50 000` avec un état visuel explicite « Limite atteinte » ;
- empêcher toute saisie qui ferait dépasser le plafond, sans supprimer le texte déjà saisi ;
- laisser publier un texte valide qui atteint exactement la limite ;
- si le contenu dépasse la limite (par exemple un ancien brouillon ou une donnée importée), afficher une erreur claire et empêcher la publication jusqu'à correction ;
- annoncer l'état de limite de façon accessible, sans dépendre uniquement de la couleur.

### Éléments à vérifier/corriger

- `EditorSurface` configure `CharacterCount.limit` et `textCounter`, mais le composant ne lit pas explicitement `editor.storage.characterCount.characters()` / `words()` ou un état `overLimit` pour afficher un message dédié.
- `CharCounter` ne change de style qu'à partir de 90 % ; il n'affiche pas de message distinct lorsque la limite est atteinte.
- `StudioScreen.canPublish` vérifie le minimum de 20 caractères, le titre et les thèmes, mais ne vérifie pas explicitement `contentText <= BODY_MAX`.
- La validation finale côté client et côté API rejette bien les contenus au-dessus de la limite, mais l'expérience utilisateur doit prévenir le blocage avant la fenêtre de publication.
- Le dernier commit aligne le compteur Tiptap, mais il ne couvre pas à lui seul les tests d'édition, collage massif, composition IME, document importé ou ancien brouillon.

À faire :
- [ ] Tester si l'extension Tiptap bloque réellement toute transaction dépassant 50 000 graphèmes dans la version installée.
- [ ] Tester la saisie au clavier, le collage, le glisser-déposer, la composition IME et les accents/emoji.
- [ ] Ajouter un état visuel explicite à 50 000 et un message d'erreur au-delà.
- [ ] Ajouter la borne haute à `canPublish` pour que le bouton et la validation soient cohérents.
- [ ] Tester un ancien brouillon déjà supérieur au plafond.
- [ ] Vérifier la limite configurée par l'administration (`settings.maxChars`) face à la limite Studio statique.
- [ ] Uniformiser les limites entre sauvegarde de brouillon, Studio, publication et paramètres administrateur.
- [ ] Vérifier les paragraphes vides et les retours à la ligne : `extractPlainText` supprime les retours terminaux alors que le commentaire de fonction affirme que les lignes vides font partie du texte.
- [ ] Tester le repli de `countGraphemes` sans `Intl.Segmenter` : `Array.from` compte les points de code et non tous les graphèmes complexes.

## 6. Limite de caractères des commentaires

**Fichier :** `features/comments/components/CommentForm.tsx`

Le champ utilise `maxLength={500}` et affiche `body.length / 500`. Il applique également `trim()` à la soumission. Le navigateur et le compteur travaillent ici en unités UTF-16, contrairement au compteur du Studio qui utilise les graphèmes Unicode.

À faire :
- [ ] Décider si les 500 caractères de commentaire signifient unités UTF-16, points de code ou graphèmes visibles.
- [ ] Aligner compteur, limite du champ et schéma serveur sur cette règle.
- [ ] Afficher clairement `500 / 500 — Limite atteinte`.
- [ ] Tester emojis, accents combinés, retours à la ligne et espaces en fin de commentaire.
- [ ] Confirmer la règle de trim à la soumission et le traitement des contenus constitués uniquement d'espaces.

## 7. Autres interactions à auditer

### Favoris

**Fichier :** `features/interactions/hooks/useBookmark.ts`

Le hook met à jour optimistement l'état global puis invalide interactions, bibliothèque et flux. À vérifier :
- [ ] doubles clics et requêtes concurrentes ;
- [ ] rollback qui ne doit pas écraser d'autres changements ;
- [ ] synchronisation de la bibliothèque et de toutes les cartes ;
- [ ] cohérence avec le compteur bookmark stocké en base ;
- [ ] réponse canonique serveur et tests multi-onglets.

### Abonnements

**Fichier :** `features/interactions/hooks/useFollow.ts`

Le hook réutilise la formule compteur initial + état courant - état de référence. Le même risque de retour temporaire à l'ancien compteur que pour les likes existe si le nombre initial du profil n'est pas rafraîchi au même moment que le cache de référence.

À faire :
- [ ] Corriger la source de vérité du compteur d'abonnés.
- [ ] Synchroniser le profil, le flux et les listes d'auteurs.
- [ ] Tester follow/unfollow, doubles clics, erreurs et plusieurs onglets.
- [ ] Vérifier le blocage et l'interdiction de s'auto-suivre.

### Vues

La PR de fiabilisation précédente traite le compteur de vues dans une branche distincte. Sur ce commit de `main`, vérifier que l'interface détail et les cartes reflètent bien la réponse serveur, que le dédoublonnage fonctionne et que les auteurs ne gonflent pas leurs propres compteurs.

## 8. Plan de tests navigateur obligatoire

- [ ] Publication avec 0 like : cliquer → 1 ; attendre 100 ms, 500 ms, 2 s et 5 s : le nombre ne doit jamais revenir à 0.
- [ ] Publication avec plusieurs likes : vérifier +1 et -1.
- [ ] Faire le même scénario depuis la page de lecture et depuis le mur.
- [ ] Vérifier l'icône active et `aria-pressed` après confirmation.
- [ ] Recharger la page et vérifier que le même état est retrouvé.
- [ ] LIKE → DISLIKE → LIKE avec réseau normal puis réseau ralenti.
- [ ] Double clic et clics alternés rapides.
- [ ] Échec API et rollback.
- [ ] Like d'un commentaire, double clic, réponse réseau inversée.
- [ ] Ajouter un commentaire et vérifier le compteur dans la discussion, la barre de lecture et le mur.
- [ ] Masquer un commentaire et vérifier la décrémentation partout, une seule fois.
- [ ] Tester deux onglets et deux utilisateurs.
- [ ] Saisir et coller du texte à 49 999, 50 000 et 50 001 graphèmes.
- [ ] Tester les emojis complexes, les accents, les lignes vides et les anciens brouillons.
- [ ] Vérifier les compteurs/limites sur mobile et avec lecteur d'écran.

## 9. Priorité recommandée

1. **P0 — Corriger la source de vérité des compteurs LIKE/DISLIKE/FOLLOW**, car le défaut peut expliquer le retour visuel après clic.
2. **P0 — Ajouter les tests navigateur réels**, car les tests API actuels ne détectent pas les défauts React Query et d'affichage.
3. **P1 — Verrouiller les mutations de likes de commentaires** et empêcher les doubles bascules.
4. **P1 — Synchroniser les compteurs de commentaires** entre discussion, lecture et flux.
5. **P1 — Ne pas perdre le texte d'un commentaire en cas d'échec.**
6. **P1 — Finaliser l'UX de la limite du Studio** et harmoniser les règles de comptage.
7. **P1 — Appliquer le même audit de source de vérité aux favoris et abonnements.**
8. **P2 — Recette multi-onglets, mobile, accessibilité et erreurs réseau.**

## 10. Limites de cet audit

- Le dernier commit audité modifie uniquement le compteur Tiptap du Studio ; il n'introduit pas la régression de compteur LIKE décrite plus haut.
- Le code serveur des réactions de publication utilise des transactions et un verrou de publication ; le défaut le plus net repéré concerne la réconciliation des compteurs côté client.
- Les tests Playwright présents dans `e2e/interactions.spec.ts` testent les API avec des requêtes HTTP. Ils ne prouvent pas le comportement visuel des composants dans un navigateur.
- Aucune session de production ni base Neon de production n'a été utilisée pour reproduire le symptôme en direct.
- Cet audit identifie une cause probable très forte dans le code, mais la validation définitive exige les scénarios navigateur décrits ci-dessus.

**Conclusion :** le dernier commit `4471e54` est une correction de comptage du texte dans le Studio. Le symptôme des likes est vraisemblablement lié à la formule de compteur optimiste dans `useLike.ts` et au rafraîchissement désynchronisé de la référence et du compteur initial. Les likes en base peuvent être correctement enregistrés alors que le nombre affiché revient brièvement — ou durablement sur la page de lecture — à l'ancienne valeur. Les commentaires présentent des risques distincts de doubles bascules, de synchronisation des compteurs et de perte du texte en cas d'erreur.
