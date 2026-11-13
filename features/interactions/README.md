# Feature Interactions

Gère les likes optimistes, favoris, partages, comptage de vues et blocages.

## API publique (`index.ts`)
- `interactionsService` : mutations et états utilisateur (routes API /api/*)
- `useLike`, `useBookmark`, `useShare`, `useViewTracker`, `useBlockUser` : hooks clients
- `LikeButton`, `BookmarkButton`, `ShareButton` : boutons d'action (≤ 50 lignes)

## Dépendances
- `features/auth`, `features/posts`, `lib/ratelimit.ts`
