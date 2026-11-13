# Feature Authors

Gère l'annuaire des plumes, la règle d'affichage `displayAuthor()` et les profils publics.

## API publique (`index.ts`)
- `displayAuthor` : résout le nom affiché selon `publishAs` (`ANONYMOUS` / `REAL_NAME` / `USERNAME`)
- `authorsService` : accès aux profils publics et à la liste de l'annuaire
- `useAuthors`, `useAuthorProfile` : hooks clients pour l'annuaire et le profil
- `AuthorRow`, `AuthorHeader` : composants d'affichage (≤ 50 lignes)

## Dépendances
- `types/index.ts`, `lib/env.ts`, `lib/format.ts`
