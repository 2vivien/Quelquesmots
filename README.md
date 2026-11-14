# Quelquesmots

Quelquesmots est une plateforme littéraire et participative : lecture de textes courts, profils d'auteurs, tags, interactions et Studio d'écriture.

## Développement

Prérequis : Bun (version compatible avec le lockfile) et Node.js compatible avec la version Next.js du projet.

```bash
bun install --frozen-lockfile
bun run dev
```

Vérifications disponibles :

```bash
bun run typecheck
bun run lint
bun run check
bun run build
```

## Configuration

Copier `.env.example` vers `.env.local`, puis renseigner les clés OAuth Google et les secrets de développement requis.

En production, `SESSION_SECRET` et `VIEW_HASH_SALT` doivent chacun contenir au moins 32 octets. Le stockage objet S3 compatible doit être configuré pour les avatars.

## État du backend — important

Les routes API actuelles reposent encore sur `lib/server/store.ts`, un store en mémoire initialisé avec des données de démonstration. PostgreSQL/Neon et Drizzle ne sont pas encore intégrés, et renseigner `DATABASE_URL` seul n'active aucune persistance.

Le backend ne doit donc pas encore être considéré comme prêt pour des données de production. Consulter [le rapport d'audit](docs/AUDIT_FRONTEND_BACKEND.md) pour les constats, corrections et prérequis restants.
