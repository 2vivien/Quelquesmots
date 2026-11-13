# Feature Themes

Gère le catalogue des thèmes éditoriaux, leurs accroches, images et compteurs.

## API publique (`index.ts`)
- `themesService` : liste des thèmes actifs, recherche et fiche par slug
- `useThemes` : hook TanStack Query
- `ThemeTile`, `ThemeRow`, `ThemeGrid`, `ThemeHero` : composants d'affichage (≤ 50 lignes)

## Dépendances
- `lib/env.ts`, `lib/format.ts`
