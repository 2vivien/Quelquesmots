# Feature Feed

Gère l'affichage du Mur d'accueil, les chips de filtrage, les cartes de texte et le défilement infini.

## API publique (`index.ts`)
- `PostCard`, `PostList`, `FeedChips`, `FeedSearch`, `PostMetrics`, `TagList` (≤ 50 lignes chacun)
- `useInfiniteFeed` : hook TanStack Query pour les filtres et la pagination par curseur

## Dépendances
- `features/authors`, `features/interactions`, `features/posts`, `features/themes`
