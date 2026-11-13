# Feature Studio

Éditeur littéraire Tiptap avec sauvegarde automatique, suggestions de tags, aperçu et publication.

## API publique (`index.ts`)
- `StudioScreen` : vue d'écriture complète (chargée dynamiquement côté client)
- `publishSchema`, `draftSchema` : validations Zod (titre 3-120, corps 20-1500, 1-5 tags)

## Dépendances
- `features/auth`, `features/posts`, `features/reader`, `features/tags`, `features/themes`, `lib/sanitize.ts`
