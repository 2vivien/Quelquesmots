# Feature Auth

Gère la session utilisateur, la connexion Google et la déconnexion.

## API publique (`index.ts`)
- `authService` : connexion, déconnexion et lecture de session
- `useAuth` : hook client synchronisé avec le store d'authentification
- `LoginCard` : carte de connexion de l'écran `/connexion` (≤ 50 lignes)

## Dépendances
- `lib/env.ts`, `features/authors`
