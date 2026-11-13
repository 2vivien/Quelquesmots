# Feature Search

Gère la recherche globale tolérante aux fautes (textes, thèmes, auteurs, tags) et les suggestions en direct.

## API publique (`index.ts`)
- `searchService`, `useSearch`, `useSuggestions`
- `SearchBar`, `SearchTabs`, `SearchResultRow`, `SuggestList` (≤ 50 lignes)

## Dépendances
- `features/authors`, `features/posts`, `features/tags`, `features/themes`, `lib/format.ts`
