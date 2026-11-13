# Feature Posts

Gère les entités de textes courts, les règles de visibilité serveur/client et les requêtes de base.

## API publique (`index.ts`)
- `postsService` : lecture par curseur, fiche par slug, brouillons et mutations
- `canViewPost` : règle métier unique de visibilité (`PUBLIC`, `MEMBERS`, `PRIVATE`)
- `PostRecord`, `FeedQuery`, `FeedPage` : types de domaine

## Dépendances
- `types/index.ts`, `lib/env.ts`, `lib/format.ts`
