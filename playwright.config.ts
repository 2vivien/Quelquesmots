import { defineConfig, devices } from "@playwright/test";

/**
 * Parcours de bout en bout Quelquesmots.
 * Nécessite une base Neon configurée dans .env (branche de l'app) ; jamais de base éphémère en local.
 * Auth Google OAuth : non couvert (nécessite un compte de test Google) — voir e2e/auth.spec.ts (skipped).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
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
      // Serveur de production (compilation unique) : déterministe, jamais de compilation à la volée.
      command:
        "GOOGLE_OAUTH_TOKEN_URL=http://127.0.0.1:3999/token GOOGLE_OAUTH_USERINFO_URL=http://127.0.0.1:3999/userinfo bun run start --port 3000",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
