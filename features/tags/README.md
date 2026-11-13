# Feature Tags

Gère la normalisation des tags, l'anti-doublon et les suggestions automatiques dans le Studio.

## API publique (`index.ts`)
- `tagsService` : liste des tags approuvés, suggestions selon le contenu
- `normalizeTagSlug` : normalisation stricte sans accents ni doublons

## Dépendances
- `lib/env.ts`, `lib/format.ts`
