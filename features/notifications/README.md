# Feature Notifications

PostgreSQL est la source de vérité. Les notifications sont créées dans la même transaction que l'action métier.

## API publique (`index.ts`)

- `notificationsService`, `useNotifications`, `useUnreadNotificationCount`, `notificationKeys`
- `NotificationRow`, `NotificationTabs`, `BellBadge`

## Routes

| Route | Rôle |
| --- | --- |
| `GET /api/notifications/unread-count` | `COUNT(*)` des non lues (cloche uniquement) |
| `GET /api/notifications` | 100 notifications récentes (page dédiée) |
| `POST /api/notifications/read` | Marquage comme lu, limité aux ids du destinataire |

Toutes sont authentifiées et répondent avec `PRIVATE_NO_STORE`.

## Polling intelligent (pas de SSE dans cette étape)

- Cloche : `refetchInterval: 15_000`, route COUNT — ne télécharge jamais la liste.
- Page : `refetchInterval: 10_000`, uniquement tant que la page est montée.
- `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`, `refetchOnReconnect: true`, `enabled: Boolean(user)`.
- Les options sont propres aux hooks : le `QueryClient` global n'est pas modifié.
- `markRead` met à jour immédiatement les deux caches puis invalide uniquement ces deux queries.

## Événements

Couverts : `LIKE` sur texte, `COMMENT`, `REPLY`, `COMMENT_LIKE`, `FOLLOW`.
Exclus volontairement : acteur lui-même, dislikes, favoris, retraits de réaction.

`COMMENT`, `REPLY` et `COMMENT_LIKE` portent `commentId` et ouvrent `/mots/{postId}#comment-{commentId}`.

## Anti-doublon et regroupement

Fenêtre retenue : **24 h**. Un même couple `(destinataire, acteur, type, postId, commentId)` réactivé dans la fenêtre met `readAt = null` et rajeunit `createdAt` au lieu d'insérer une ligne. Aucun événement déjà enregistré n'est supprimé. Cela couvre le retrait puis la remise d'un like sans flooder la cloche.

Stratégie de regroupement visée (non implémentée ici, nécessite une migration dédiée) :
regrouper les `LIKE` d'un même texte sur une fenêtre glissante d'1 h en une seule entrée
du type « Marie et 4 autres personnes ont aimé votre texte ». Le contrat devra porter
les identifiants des acteurs pour que le marquage comme lu couvre tout le groupe, et la
période de regroupement devra être alignée sur l'anti-doublon. Aucune donnée existante
ne doit être écrasée lors de la bascule.

## Dépendances

- `features/auth`, `features/authors`, `lib/env.ts`, `lib/format.ts`
- Migration : `db/migrations/0002_workable_post.sql`
