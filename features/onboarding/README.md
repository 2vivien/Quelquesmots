# Feature Onboarding

Gère la première configuration du profil après connexion Google (`/bienvenue`).

## API publique (`index.ts`)
- `onboardingSchema` : validation Zod du pseudonyme, bio et acceptation
- `useOnboarding` : vérification de disponibilité du pseudonyme et validation finale
- `OnboardingCard`, `UsernameField` : composants d'affichage (≤ 50 lignes)

## Dépendances
- `features/auth`, `features/authors`
