# Règles agent — Quelquesmots

## Fichiers d'environnement — interdiction absolue de modifier

- `.env` et toutes ses variantes (`.env.*`, `*.env`) contiennent les identifiants **Neon** et les secrets API du projet.
- **Un agent ne doit JAMAIS créer, modifier, écraser ni supprimer `.env` sans accord explicite de l'utilisateur.**
- Seul l'utilisateur modifie `.env`. Si un agent a besoin d'un changement dans `.env`, il **demande d'abord** l'accord en expliquant précisément quoi et pourquoi.
- La lecture pour exécution (`source .env`) est autorisée ; l'écriture est interdite par défaut.

## Next.js — build, dev server et processus (obligatoire)

1. **Isolation dev / prod** — `next dev` écrit dans `.next-dev`, `next build`/`next start` dans `.next` (voir `next.config.ts`, `distDir` par phase). Les deux peuvent coexister sans se détruire.
2. **Identifier les processus avant d'agir** — `ps -eo pid,ppid,lstart,args | grep '[n]ext'`, `ss -ltnp | grep -E ':(3000|3100|3999)\b'`, `readlink /proc/<PID>/cwd`. **Ne jamais tuer un processus qui n'appartient pas à l'agent** (PID, port, cwd) ; ne jamais `rm -rf` un répertoire de sortie tant qu'un processus l'utilise.
3. **Ne pas supposer le port 3000** — vérifier ce qui y tourne avant de s'y servir (PID, cwd). Idem 3100 (tests) et 3999 (mock Google).
4. **Un build n'est réussi que prouvé** — vérifier le **exit code**, la présence de `.next/BUILD_ID`, le démarrage du serveur de production et des tests. Un build interrompu/partiel est un build échoué ou non vérifié. Ne pas enchaîner `clean` + rebuild en boucle sans diagnostiquer l'erreur d'origine.
5. **Playwright — dev ≠ production** — les tests e2e sont des tests de PRODUCTION : `test:e2e` = build → `next start --port 3100` (dédié) → suite. `reuseExistingServer: false` : un port 3100 occupé fait échouer le run plutôt que de tester silencieusement un autre serveur. Ne jamais pointer la suite sur un serveur de développement par erreur.
6. **Ce repo n'est pas Monorepo/Docker** — adapter ces règles si des Dockerfiles, caches CI ou turbo.json sont ajoutés : les répertoires de sortie doivent y être connus.
