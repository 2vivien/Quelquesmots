import { defineConfig, devices } from "@playwright/test";

/**
 * Parcours de bout en bout Quelquesmots — tests de PRODUCTION.
 *
 * Nécessite :
 * 1. `bun run build` déjà réussi (avec sortie `.next`) ;
 * 2. le port 3100 libre ;
 * 3. une base Neon configurée dans .env (branche de l'app) ; jamais de base éphémère en local.
 *
 * Auth Google OAuth : couverte via le bouchon `scripts/mock-google.ts` (jamais de compte Google réel).
 * Ce serveur de test n'est JAMAIS réutilisé silencieusement : `reuseExistingServer: false` —
 * un port 3100 occupé fait échouer le run au lieu de tester un autre serveur.
 * Le serveur de développement (`next dev`, port 3000, sortie `.next-dev`) n'est pas impliqué.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "bun run scripts/mock-google.ts",
      url: "http://127.0.0.1:3999/userinfo",
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command:
        "GOOGLE_OAUTH_TOKEN_URL=http://127.0.0.1:3999/token GOOGLE_OAUTH_USERINFO_URL=http://127.0.0.1:3999/userinfo bun run start --port 3100",
      url: "http://localhost:3100",
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
