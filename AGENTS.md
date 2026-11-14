# Règles agent — Quelquesmots

## Fichiers d'environnement — interdiction absolue de modifier

- `.env` et toutes ses variantes (`.env.*`, `*.env`) contiennent les identifiants **Neon** et les secrets API du projet.
- **Un agent ne doit JAMAIS créer, modifier, écraser ni supprimer `.env` sans accord explicite de l'utilisateur.**
- Seul l'utilisateur modifie `.env`. Si un agent a besoin d'un changement dans `.env`, il **demande d'abord** l'accord en expliquant précisément quoi et pourquoi.
- La lecture pour exécution (`source .env`) est autorisée ; l'écriture est interdite par défaut.
